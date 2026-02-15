import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";
import { isAdmin } from "@/lib/admin";
import UserMenu from "./UserMenu";

type Props = {
  title?: string;
};

export default async function Header({
  title = "mic",
}: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIsAdmin = await isAdmin();

  // Get user balance from profiles (in cents)
  let balance = 100000; // Default $1000
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();
    balance = profile?.balance ?? 100000;
  }

  return (
    <header className="flex items-center justify-between gap-4 pb-12">
      <Link
        href={user ? ROUTES.DASHBOARD : ROUTES.HOME}
        className="flex items-center no-underline hover:opacity-90 transition-opacity"
        aria-label={title}
      >
        <Image
          src="/mic_dragon_treehacks.jpeg"
          alt="mic"
          width={256}
          height={256}
          priority
          className="h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32 object-contain"
        />
      </Link>
      <div className="flex items-center gap-3">
        {user ? (
          <UserMenu user={user} balance={balance} isAdmin={userIsAdmin} />
        ) : (
          <Link
            href={ROUTES.LOGIN}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
