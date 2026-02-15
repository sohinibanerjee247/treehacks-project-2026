import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

/** Create a market (admin only). */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const channelId = String(body.channelId ?? "").trim();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const rules = String(body.rules ?? "").trim();
  const resolutionSource = String(body.resolutionSource ?? "").trim();
  const closeTime = String(body.closeTime ?? "").trim();
  const expectedResolutionTime = String(body.expectedResolutionTime ?? "").trim();

  if (!channelId || !title || !description || !rules || !resolutionSource || !closeTime || !expectedResolutionTime) {
    return NextResponse.json(
      { error: "channelId, title, description, rules, resolutionSource, closeTime, and expectedResolutionTime are required" },
      { status: 400 }
    );
  }

  const close = new Date(closeTime);
  const expected = new Date(expectedResolutionTime);
  if (Number.isNaN(close.getTime()) || Number.isNaN(expected.getTime())) {
    return NextResponse.json(
      { error: "Invalid closeTime or expectedResolutionTime" },
      { status: 400 }
    );
  }
  if (expected.getTime() < close.getTime()) {
    return NextResponse.json(
      { error: "Expected resolution time must be after close time" },
      { status: 400 }
    );
  }

  // Create the market
  const { data: market, error } = await supabase
    .from("markets")
    .insert({
      channel_id: channelId,
      title,
      description,
      rules,
      resolution_source: resolutionSource,
      open_time: new Date().toISOString(),
      close_time: close.toISOString(),
      expected_resolution_time: expected.toISOString(),
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(market, { status: 201 });
}
