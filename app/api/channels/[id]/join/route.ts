import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

/** Join a channel (non-admin only). */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admins cannot join channels
  if (await isAdmin()) {
    return NextResponse.json({ error: "Admins cannot join channels" }, { status: 403 });
  }

  const { id: channelId } = params;

  // Check channel exists
  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("id")
    .eq("id", channelId)
    .single();

  if (channelError || !channel) {
    console.error("Channel lookup failed:", channelError?.message);
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  // Use plain insert instead of upsert (upsert needs UPDATE policy too)
  const { error } = await supabase
    .from("channel_members")
    .insert({ user_id: user.id, channel_id: channelId });

  if (error) {
    // Duplicate = already joined, that's fine
    if (error.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    console.error("Join channel failed:", error.code, error.message, error.details, error.hint);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
