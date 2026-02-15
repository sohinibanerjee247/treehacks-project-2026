import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

/** Update a channel (admin only). */
export async function PATCH(
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

  const { id: channelId } = params;
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const description = body.description !== undefined ? String(body.description).trim() : undefined;

  if (!name) {
    return NextResponse.json(
      { error: "name required" },
      { status: 400 }
    );
  }

  const updateData: any = { name };
  if (description !== undefined) {
    updateData.description = description || null;
  }

  const { data: channel, error } = await supabase
    .from("channels")
    .update(updateData)
    .eq("id", channelId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(channel);
}

/** Delete a channel (admin only). */
export async function DELETE(
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

  const { id: channelId } = params;

  const { error } = await supabase
    .from("channels")
    .delete()
    .eq("id", channelId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
