import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

/**
 * Resolve a market (admin only).
 * Winning shares pay 100 cents ($1) each. Losing shares pay 0.
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
    return NextResponse.json(
      { error: "outcome must be 'yes' or 'no'" },
      { status: 400 }
    );
  }

  // Mark market as resolved
  const { error: marketError } = await supabase
    .from("markets")
    .update({
      resolved: true,
      outcome,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", marketId);

  if (marketError) {
    return NextResponse.json({ error: marketError.message }, { status: 500 });
  }

  // Get all positions for this market
  const { data: positions, error: posError } = await supabase
    .from("positions")
    .select("user_id, yes_shares, no_shares")
    .eq("market_id", marketId);

  if (posError) {
    console.error("Failed to get positions:", posError);
    return NextResponse.json({ error: posError.message }, { status: 500 });
  }

  // Pay out: each winning share = 100 cents ($1)
  const payouts: { user_id: string; payout: number }[] = [];

  for (const pos of positions ?? []) {
    const winningShares =
      outcome === "YES" ? pos.yes_shares : pos.no_shares;

    if (winningShares <= 0) continue;

    const payout = Math.floor(winningShares * 100); // $1 per share in cents

    // Get current balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", pos.user_id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ balance: profile.balance + payout })
        .eq("id", pos.user_id);
    }

    payouts.push({ user_id: pos.user_id, payout });
  }

  return NextResponse.json({ ok: true, marketId, outcome, payouts });
}
