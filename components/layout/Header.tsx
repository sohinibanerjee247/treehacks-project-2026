import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";
import UserMenu from "./UserMenu";

type Props = {
  title?: string;
};

export default async function Header({
  title = "Micro Prediction Market",
}: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between gap-4 pb-12">
      <Link
        href={user ? ROUTES.DASHBOARD : ROUTES.HOME}
        className="text-xl font-semibold tracking-tight text-zinc-100 no-underline hover:text-white transition-colors"
      >
        {title}
      </Link>
      <div className="flex items-center gap-3">
        {user ? (
          <UserMenu user={user} balance={1000} />
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
