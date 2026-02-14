import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

/** Create a market (admin only). */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(user.email)) {
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

  // TODO: insert into DB when you have channels/markets tables
  const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return NextResponse.json({ id, channelId, title, description }, { status: 201 });
}
