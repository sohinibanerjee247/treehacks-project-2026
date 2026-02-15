import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** DELETE /api/orders/[id] — cancel a pending order */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
