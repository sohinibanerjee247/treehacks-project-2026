import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? ROUTES.DASHBOARD;
  if (!next.startsWith("/")) {
    next = ROUTES.DASHBOARD;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const origin = request.headers.get("x-forwarded-host")
        ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host")}`
        : new URL(request.url).origin;
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}${ROUTES.LOGIN}?error=auth`);
}
