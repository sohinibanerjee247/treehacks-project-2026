import { createClient } from "@/lib/supabase/server";

/** Admin email - automatically has admin rights. */
export const ADMIN_EMAIL = "sohinibanerjee247@gmail.com";

/** Check if the current user is an admin (by email OR by database role). */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  // Check if email matches admin email
  if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  // Also check database role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

/** Get the user's profile including role. */
export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
