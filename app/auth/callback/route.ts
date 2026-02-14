import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = new URL(request.url).origin;
  
  // Check if Supabase sent an error
  const errorFromSupabase = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  
  if (errorFromSupabase) {
    const errorMessage = errorDescription 
      ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
      : "Authentication failed";
    
    // Only log actual errors, not expected user cancellations
    if (errorFromSupabase !== "access_denied") {
      console.error("Supabase auth error:", errorFromSupabase, errorMessage);
    }
    
    return NextResponse.redirect(
      `${origin}${ROUTES.LOGIN}?error=${encodeURIComponent(errorMessage)}`
    );
  }

  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? ROUTES.DASHBOARD;
  if (!next.startsWith("/")) {
    next = ROUTES.DASHBOARD;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectOrigin = request.headers.get("x-forwarded-host")
        ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host")}`
        : origin;
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
    
    // Log error for debugging (but not session-missing errors)
    if (error.message !== "Auth session missing!") {
      console.error("Auth callback error:", error.message);
    }
    return NextResponse.redirect(
      `${origin}${ROUTES.LOGIN}?error=${encodeURIComponent(error.message || "auth")}`
    );
  }

  return NextResponse.redirect(`${origin}${ROUTES.LOGIN}?error=No code provided`);
}
