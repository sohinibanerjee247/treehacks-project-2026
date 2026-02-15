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

  if (!channelId || !title) {
    return NextResponse.json(
      { error: "channelId and title required" },
      { status: 400 }
    );
  }

  // Insert market into database with initial pool of 10,000 shares each (50/50 price)
  const { data: market, error } = await supabase
    .from("markets")
    .insert({
      channel_id: channelId,
      title,
      description: description || null,
      created_by: user.id,
      yes_pool: 10000,
      no_pool: 10000,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(market, { status: 201 });
}
