import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { buyYes, buyNo, sellYes, sellNo } from "@/lib/market";

/**
 * POST /api/markets/[id]/trade
 * Body: { action: "buy" | "sell", side: "YES" | "NO", amount: number }
 *   - For buy:  `amount` is cents to spend
 *   - For sell: `amount` is number of shares to sell
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (await isAdmin()) {
    return NextResponse.json(
      { error: "Admins cannot trade" },
      { status: 403 }
    );
  }

  const { id: marketId } = params;
  const body = await req.json();
  const action = String(body.action ?? "").toLowerCase();
  const side = String(body.side ?? "").toUpperCase();
  const amount = Number(body.amount ?? 0);

  if (action !== "buy" && action !== "sell") {
    return NextResponse.json(
      { error: "action must be 'buy' or 'sell'" },
      { status: 400 }
    );
  }
  if (side !== "YES" && side !== "NO") {
    return NextResponse.json(
      { error: "side must be 'YES' or 'NO'" },
      { status: 400 }
    );
  }
  if (amount <= 0) {
    return NextResponse.json({ error: "amount must be > 0" }, { status: 400 });
  }

  // Get market
  const { data: market, error: marketError } = await supabase
    .from("markets")
    .select("id, resolved, yes_pool, no_pool")
    .eq("id", marketId)
    .single();

  if (marketError || !market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  if (market.resolved) {
    return NextResponse.json({ error: "Market is closed" }, { status: 400 });
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Get user's current position
  const { data: position } = await supabase
    .from("positions")
    .select("yes_shares, no_shares")
    .eq("user_id", user.id)
    .eq("market_id", marketId)
    .maybeSingle();

  const currentYesShares = position?.yes_shares ?? 0;
  const currentNoShares = position?.no_shares ?? 0;

  // Virtual liquidity for stable pricing while visible pool starts at 0.
  const effectiveYesPool = (market.yes_pool ?? 0) > 0 ? market.yes_pool : 10000;
  const effectiveNoPool = (market.no_pool ?? 0) > 0 ? market.no_pool : 10000;

  let newYesPool: number;
  let newNoPool: number;
  let sharesChange: number;
  let balanceChange: number; // positive = user gains money, negative = user pays
  let newYesShares: number;
  let newNoShares: number;

  if (action === "buy") {
    // amount = cents to spend
    const cost = amount;
    if (cost < 100) {
      return NextResponse.json(
        { error: "Minimum trade is $1.00" },
        { status: 400 }
      );
    }
    if (profile.balance < cost) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    if (side === "YES") {
      const result = buyYes(effectiveYesPool, effectiveNoPool, cost);
      sharesChange = result.shares;
      newYesPool = result.yesPool;
      newNoPool = result.noPool;
      newYesShares = currentYesShares + sharesChange;
      newNoShares = currentNoShares;
    } else {
      const result = buyNo(effectiveYesPool, effectiveNoPool, cost);
      sharesChange = result.shares;
      newYesPool = result.yesPool;
      newNoPool = result.noPool;
      newYesShares = currentYesShares;
      newNoShares = currentNoShares + sharesChange;
    }
    balanceChange = -cost;
  } else {
    // action === "sell"
    // amount = shares to sell
    if (side === "YES") {
      if (currentYesShares < amount) {
        return NextResponse.json(
          {
            error: `You only have ${currentYesShares.toFixed(2)} YES shares`,
          },
          { status: 400 }
        );
      }
      const result = sellYes(effectiveYesPool, effectiveNoPool, amount);
      sharesChange = amount;
      newYesPool = result.yesPool;
      newNoPool = result.noPool;
      balanceChange = Math.floor(result.payout);
      newYesShares = currentYesShares - sharesChange;
      newNoShares = currentNoShares;
    } else {
      if (currentNoShares < amount) {
        return NextResponse.json(
          { error: `You only have ${currentNoShares.toFixed(2)} NO shares` },
          { status: 400 }
        );
      }
      const result = sellNo(effectiveYesPool, effectiveNoPool, amount);
      sharesChange = amount;
      newYesPool = result.yesPool;
      newNoPool = result.noPool;
      balanceChange = Math.floor(result.payout);
      newYesShares = currentYesShares;
      newNoShares = currentNoShares - sharesChange;
    }
  }

  // Update market pools
  const { error: poolError } = await supabase
    .from("markets")
    .update({ yes_pool: newYesPool, no_pool: newNoPool })
    .eq("id", marketId);

  if (poolError) {
    console.error("Pool update failed:", poolError);
    return NextResponse.json({ error: "Trade failed" }, { status: 500 });
  }

  // Update user balance
  const { error: balError } = await supabase
    .from("profiles")
    .update({ balance: profile.balance + balanceChange })
    .eq("id", user.id);

  if (balError) {
    // Rollback pool
    await supabase
      .from("markets")
      .update({ yes_pool: market.yes_pool, no_pool: market.no_pool })
      .eq("id", marketId);
    console.error("Balance update failed:", balError);
    return NextResponse.json({ error: "Trade failed" }, { status: 500 });
  }

  // Upsert position
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
    // Rollback balance and pool
    await supabase
      .from("profiles")
      .update({ balance: profile.balance })
      .eq("id", user.id);
    await supabase
      .from("markets")
      .update({ yes_pool: market.yes_pool, no_pool: market.no_pool })
      .eq("id", marketId);
    console.error("Position update failed:", posError);
    return NextResponse.json({ error: "Trade failed" }, { status: 500 });
  }

  // Record in bets table for history
  await supabase.from("bets").insert({
    user_id: user.id,
    market_id: marketId,
    side,
    amount: Math.abs(balanceChange),
    shares: sharesChange,
    type: action,
  });

  return NextResponse.json({
    ok: true,
    action,
    side,
    shares: sharesChange,
    cost: Math.abs(balanceChange),
    newBalance: profile.balance + balanceChange,
    position: { yes_shares: newYesShares, no_shares: newNoShares },
  });
}
