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
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  // Insert membership (upsert to avoid duplicate errors)
  const { error } = await supabase
    .from("channel_members")
    .upsert(
      { user_id: user.id, channel_id: channelId },
      { onConflict: "user_id,channel_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
