import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { ROUTES } from "@/lib/constants";
import CreateMarketForm from "./CreateMarketForm";

const MOCK_CHANNELS = [
  { id: "ch-1", name: "Campus Life" },
  { id: "ch-2", name: "Sports" },
  { id: "ch-3", name: "CS 101" },
];

export default async function CreateMarketPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  if (!isAdminEmail(user.email)) {
    redirect(ROUTES.DASHBOARD);
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-6">
        <a
          href={ROUTES.DASHBOARD}
          className="text-sm text-zinc-500 hover:text-zinc-400"
        >
          ← Dashboard
        </a>
      </p>
      <h1 className="text-xl font-semibold text-zinc-100">Create market</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Only admins can create markets. This will appear in the chosen channel.
      </p>
      <CreateMarketForm channels={MOCK_CHANNELS} />
    </div>
  );
}
