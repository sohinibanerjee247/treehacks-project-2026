import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

/** Resolve a market (admin only). */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id: marketId } = params;
  const body = await req.json();
  const outcome = String(body.outcome ?? "").toLowerCase();

  if (outcome !== "yes" && outcome !== "no") {
    return NextResponse.json(
      { error: "outcome must be 'yes' or 'no'" },
      { status: 400 }
    );
  }

  // TODO: update market status and run settlement when you have DB
  return NextResponse.json({ ok: true, marketId, outcome });
}
