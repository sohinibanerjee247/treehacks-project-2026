import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { ROUTES } from "@/lib/constants";
import CreateChannelForm from "./CreateChannelForm";

export default async function CreateChannelPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  if (!(await isAdmin())) {
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
      <h1 className="text-xl font-semibold text-zinc-100">Create channel</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Only admins can create channels. Users will be able to join and see markets in this channel.
      </p>
      <CreateChannelForm />
    </div>
  );
}
