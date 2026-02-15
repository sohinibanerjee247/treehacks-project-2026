import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/markets/[id]/comments
 * Adds a comment to a market's discussion thread.
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

  const { id: marketId } = params;
  const body = await req.json();
  const content = String(body.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: "Comment too long (max 2000 chars)" }, { status: 400 });
  }

  // Verify market exists
  const { data: market } = await supabase
    .from("markets")
    .select("id")
    .eq("id", marketId)
    .single();

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  const { data: comment, error } = await supabase
    .from("market_comments")
    .insert({
      market_id: marketId,
      user_id: user.id,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert comment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comment, { status: 201 });
}
