import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { buyNo, buyYes } from "@/lib/market";

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
    .select("id, resolved, close_time, yes_pool, no_pool")
    .eq("id", marketId)
    .single();

  if (marketError || !market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  if (market.resolved) {
    return NextResponse.json({ error: "Market is closed" }, { status: 400 });
  }
  if (market.close_time && new Date(market.close_time).getTime() <= Date.now()) {
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

  // Get existing position
  const { data: position } = await supabase
    .from("positions")
    .select("yes_shares, no_shares")
    .eq("user_id", user.id)
    .eq("market_id", marketId)
    .maybeSingle();

  const currentYesShares = position?.yes_shares ?? 0;
  const currentNoShares = position?.no_shares ?? 0;

  const effectiveYesPool = (market.yes_pool ?? 0) > 0 ? market.yes_pool : 10000;
  const effectiveNoPool = (market.no_pool ?? 0) > 0 ? market.no_pool : 10000;

  const result = side === "YES"
    ? buyYes(effectiveYesPool, effectiveNoPool, amount)
    : buyNo(effectiveYesPool, effectiveNoPool, amount);

  const newYesPool = result.yesPool;
  const newNoPool = result.noPool;
  const newYesShares = side === "YES" ? currentYesShares + result.shares : currentYesShares;
  const newNoShares = side === "NO" ? currentNoShares + result.shares : currentNoShares;

  // Deduct balance
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

  // Update pool
  const { error: poolError } = await supabase
    .from("markets")
    .update({ yes_pool: newYesPool, no_pool: newNoPool })
    .eq("id", marketId);

  if (poolError) {
    await supabase
      .from("profiles")
      .update({ balance: profile.balance })
      .eq("id", user.id);

    return NextResponse.json(
      { error: "Failed to update market pool" },
      { status: 500 }
    );
  }

  const { error: posError } = await supabase.from("positions").upsert(
    {
      user_id: user.id,
      market_id: marketId,
      yes_shares: newYesShares,
      no_shares: newNoShares,
    },
    { onConflict: "user_id,market_id" }
  );

  if (posError) {
    await supabase
      .from("profiles")
      .update({ balance: profile.balance })
      .eq("id", user.id);
    await supabase
      .from("markets")
      .update({ yes_pool: market.yes_pool, no_pool: market.no_pool })
      .eq("id", marketId);

    return NextResponse.json(
      { error: "Failed to update position" },
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
      type: "buy",
    })
    .select()
    .single();

  if (betError) {
    // Rollback updates
    await supabase
      .from("profiles")
      .update({ balance: profile.balance })
      .eq("id", user.id);
    await supabase
      .from("markets")
      .update({ yes_pool: market.yes_pool, no_pool: market.no_pool })
      .eq("id", marketId);
    await supabase
      .from("positions")
      .upsert(
        {
          user_id: user.id,
          market_id: marketId,
          yes_shares: currentYesShares,
          no_shares: currentNoShares,
        },
        { onConflict: "user_id,market_id" }
      );

    return NextResponse.json(
      { error: "Failed to place bet" },
      { status: 500 }
    );
  }

  return NextResponse.json(bet, { status: 201 });
}
