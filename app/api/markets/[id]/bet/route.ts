import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

/** Place a bet on a market (non-admin only). */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admins cannot place bets
  if (await isAdmin()) {
    return NextResponse.json({ error: "Admins cannot place bets" }, { status: 403 });
  }

  const { id: marketId } = params;
  const body = await req.json();
  const side = String(body.side ?? "").toUpperCase();
  const amount = Number(body.amount ?? 0);

  if (side !== "YES" && side !== "NO") {
    return NextResponse.json(
      { error: "side must be 'YES' or 'NO'" },
      { status: 400 }
    );
  }

  if (amount < 100) {
    return NextResponse.json(
      { error: "Minimum bet is $1.00 (100 cents)" },
      { status: 400 }
    );
  }

  // Check market exists and is open
  const { data: market, error: marketError } = await supabase
    .from("markets")
    .select("resolved")
    .eq("id", marketId)
    .single();

  if (marketError || !market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  if (market.resolved) {
    return NextResponse.json({ error: "Market is closed" }, { status: 400 });
  }

  // Check user balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.balance < amount) {
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 }
    );
  }

  // Deduct balance and insert bet in a transaction
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ balance: profile.balance - amount })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update balance" },
      { status: 500 }
    );
  }

  const { data: bet, error: betError } = await supabase
    .from("bets")
    .insert({
      user_id: user.id,
      market_id: marketId,
      side,
      amount,
    })
    .select()
    .single();

  if (betError) {
    // Rollback balance update
    await supabase
      .from("profiles")
      .update({ balance: profile.balance })
      .eq("id", user.id);

    return NextResponse.json(
      { error: "Failed to place bet" },
      { status: 500 }
    );
  }

  return NextResponse.json(bet, { status: 201 });
}
