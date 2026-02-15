import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

/**
 * Resolve a market (admin only).
 *
 * Payout: winners split the ENTIRE pool proportionally.
 * Example: $100 on YES, $50 on NO, outcome = YES
 *   → Each YES bettor gets (their_bet / $100) × $150
 *
 * Also cancels all pending orders on this market.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id: marketId } = params;
  const body = await req.json();
  const outcome = String(body.outcome ?? "").toUpperCase();

  if (outcome !== "YES" && outcome !== "NO") {
    return NextResponse.json({ error: "outcome must be YES or NO" }, { status: 400 });
  }

  const { data: market } = await supabase
    .from("markets")
    .select("id, resolved")
    .eq("id", marketId)
    .single();

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  if (market.resolved) {
    return NextResponse.json({ error: "Already resolved" }, { status: 400 });
  }

  // Admin client bypasses RLS for cross-user payouts
  const admin = createAdminClient();

  // Mark resolved
  await admin
    .from("markets")
    .update({
      resolved: true,
      outcome,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", marketId);

  // Cancel all pending orders for this market
  await admin
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("market_id", marketId)
    .eq("status", "pending");

  // Get ALL executed bets
  const { data: allBets } = await admin
    .from("bets")
    .select("user_id, side, amount")
    .eq("market_id", marketId);

  const bets = allBets ?? [];
  const totalPool = bets.reduce((s, b) => s + b.amount, 0);
  const winningBets = bets.filter((b) => b.side === outcome);
  const winningPool = winningBets.reduce((s, b) => s + b.amount, 0);

  // Pay out winners proportionally from the total pool
  const payouts: { user_id: string; payout: number }[] = [];

  if (winningPool > 0) {
    for (const bet of winningBets) {
      const share = bet.amount / winningPool;
      const payout = Math.floor(share * totalPool);

      const { data: p } = await admin
        .from("profiles")
        .select("balance")
        .eq("id", bet.user_id)
        .single();

      if (p) {
        await admin
          .from("profiles")
          .update({ balance: p.balance + payout })
          .eq("id", bet.user_id);
      }

      payouts.push({ user_id: bet.user_id, payout });
    }
  }

  return NextResponse.json({ ok: true, marketId, outcome, totalPool, payouts });
}
