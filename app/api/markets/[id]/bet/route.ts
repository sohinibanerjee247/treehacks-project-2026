import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

/**
 * POST /api/markets/[id]/bet
 *
 * 1. Look for pending orders on the OPPOSITE side (oldest first / FIFO).
 * 2. Match dollar-for-dollar. For each match deduct BOTH balances, record bets.
 * 3. Unmatched remainder → new pending order (no balance deduction).
 *
 * Uses an admin (service-role) client for cross-user writes (profiles, orders,
 * bets) so RLS doesn't block updates to the counterparty's rows.
 *
 * Body: { side: "YES" | "NO", amount: number (dollars) }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth check uses the normal per-user client
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (await isAdmin()) {
    return NextResponse.json({ error: "Admins cannot bet" }, { status: 403 });
  }

  const { id: marketId } = params;
  const body = await req.json();
  const side = String(body.side ?? "").toUpperCase();
  const amountDollars = Number(body.amount ?? 0);

  if (side !== "YES" && side !== "NO") {
    return NextResponse.json({ error: "side must be YES or NO" }, { status: 400 });
  }
  if (amountDollars < 1) {
    return NextResponse.json({ error: "Minimum bet is $1" }, { status: 400 });
  }

  const amountCents = Math.round(amountDollars * 100);

  // Admin client bypasses RLS for cross-user operations
  const admin = createAdminClient();

  // Verify market is open
  const { data: market } = await admin
    .from("markets")
    .select("id, resolved")
    .eq("id", marketId)
    .single();

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  if (market.resolved) {
    return NextResponse.json({ error: "Market is closed" }, { status: 400 });
  }

  // Verify user balance
  const { data: profile } = await admin
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  if (profile.balance < amountCents) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  // ── Matching engine ───────────────────────────────────────────────
  const oppositeSide = side === "YES" ? "NO" : "YES";

  const { data: matchingOrders } = await admin
    .from("orders")
    .select("*")
    .eq("market_id", marketId)
    .eq("side", oppositeSide)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  let remaining = amountCents;
  let totalFilled = 0;

  for (const order of matchingOrders ?? []) {
    if (remaining <= 0) break;
    if (order.user_id === user.id) continue;

    const orderRemaining = order.amount - order.filled_amount;
    if (orderRemaining <= 0) continue;

    const fillAmount = Math.min(remaining, orderRemaining);

    // Check counterparty can still afford it
    const { data: matchedProfile } = await admin
      .from("profiles")
      .select("balance")
      .eq("id", order.user_id)
      .single();

    if (!matchedProfile || matchedProfile.balance < fillAmount) {
      await admin
        .from("orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", order.id);
      continue;
    }

    // Deduct counterparty balance
    await admin
      .from("profiles")
      .update({ balance: matchedProfile.balance - fillAmount })
      .eq("id", order.user_id);

    // Deduct current user balance
    const { data: freshProfile } = await admin
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();

    await admin
      .from("profiles")
      .update({ balance: (freshProfile?.balance ?? profile.balance) - fillAmount })
      .eq("id", user.id);

    // Record bets for both sides
    await admin.from("bets").insert({
      user_id: order.user_id,
      market_id: marketId,
      side: order.side,
      amount: fillAmount,
    });

    await admin.from("bets").insert({
      user_id: user.id,
      market_id: marketId,
      side: side,
      amount: fillAmount,
    });

    // Update matched order
    const newFilled = order.filled_amount + fillAmount;
    await admin
      .from("orders")
      .update({
        filled_amount: newFilled,
        status: newFilled >= order.amount ? "filled" : "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    remaining -= fillAmount;
    totalFilled += fillAmount;
  }

  // ── Place remainder as pending order ──────────────────────────────
  if (remaining > 0) {
    const { error: orderError } = await admin.from("orders").insert({
      user_id: user.id,
      market_id: marketId,
      side: side,
      price: 50,
      amount: remaining,
      filled_amount: 0,
      status: "pending",
    });

    if (orderError) {
      console.error("Failed to insert order:", orderError);
      return NextResponse.json(
        { error: "Failed to place order: " + orderError.message },
        { status: 500 }
      );
    }
  }

  // ── Response ──────────────────────────────────────────────────────
  if (totalFilled > 0 && remaining > 0) {
    return NextResponse.json({
      ok: true,
      message: `$${(totalFilled / 100).toFixed(2)} matched on ${side}, $${(remaining / 100).toFixed(2)} waiting for a counterparty`,
    });
  } else if (totalFilled > 0) {
    return NextResponse.json({
      ok: true,
      message: `Bet placed: $${(totalFilled / 100).toFixed(2)} on ${side}`,
    });
  } else {
    return NextResponse.json({
      ok: true,
      message: `$${(remaining / 100).toFixed(2)} on ${side} — waiting for a counterparty`,
    });
  }
}
