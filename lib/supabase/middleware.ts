import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - wrap in try/catch to handle deleted users
  try {
    const { error } = await supabase.auth.getUser();
    
    // If there's an error (e.g., user was deleted), clear the auth cookies
    // Don't log "Auth session missing" as it's expected for logged-out users
    if (error && error.message !== "Auth session missing!") {
      console.error("Auth middleware error:", error.message);
    }
    
    // Clear stale cookies if there's any auth error
    if (error) {
      const cookiesToRemove = request.cookies.getAll()
        .filter(cookie => cookie.name.startsWith('sb-'))
        .map(cookie => cookie.name);
      
      cookiesToRemove.forEach(name => {
        supabaseResponse.cookies.delete(name);
      });
    }
  } catch (err: any) {
    // Only log unexpected exceptions
    if (err?.message !== "Auth session missing!") {
      console.error("Auth middleware exception:", err?.message || err);
    }
    
    // Clear auth cookies on any error
    const cookiesToRemove = request.cookies.getAll()
      .filter(cookie => cookie.name.startsWith('sb-'))
      .map(cookie => cookie.name);
    
    cookiesToRemove.forEach(name => {
      supabaseResponse.cookies.delete(name);
    });
  }

  return supabaseResponse;
}
