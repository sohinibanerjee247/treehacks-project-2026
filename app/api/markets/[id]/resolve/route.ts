import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

/** Resolve a market (admin only). */
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

  // Update market and run settlement
  const { data: market, error: marketError } = await supabase
    .from("markets")
    .update({
      resolved: true,
      outcome,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", marketId)
    .select()
    .single();

  if (marketError) {
    return NextResponse.json({ error: marketError.message }, { status: 500 });
  }

  // Get all bets for this market
  const { data: bets, error: betsError } = await supabase
    .from("bets")
    .select("*")
    .eq("market_id", marketId);

  if (betsError) {
    return NextResponse.json({ error: betsError.message }, { status: 500 });
  }

  // Calculate payouts (parimutuel: winning side shares the pool)
  const totalYes = bets
    ?.filter((b) => b.side === "YES")
    .reduce((sum, b) => sum + b.amount, 0) || 0;
  const totalNo = bets
    ?.filter((b) => b.side === "NO")
    .reduce((sum, b) => sum + b.amount, 0) || 0;
  const pool = totalYes + totalNo;
  const totalWinning = outcome === "YES" ? totalYes : totalNo;

  if (totalWinning === 0 || pool === 0) {
    return NextResponse.json({ ok: true, marketId, outcome, payouts: [] });
  }

  // Calculate each winner's payout and update balances
  const winners = bets?.filter((b) => b.side === outcome) || [];
  const payouts = [];

  for (const bet of winners) {
    const share = bet.amount / totalWinning;
    const payout = Math.floor(share * pool);
    
    // Update user balance
    const { error: updateError } = await supabase.rpc("increment_balance", {
      user_id: bet.user_id,
      amount: payout,
    });

    // If RPC doesn't exist, use update directly
    if (updateError) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", bet.user_id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ balance: profile.balance + payout })
          .eq("id", bet.user_id);
      }
    }

    payouts.push({ user_id: bet.user_id, payout });
  }

  return NextResponse.json({ ok: true, marketId, outcome, payouts });
}
