import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { Card } from "@/components/ui";
import JoinButton from "./JoinButton";

export default async function ChannelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIsAdmin = await isAdmin();

  // Get all channels
  const { data: channels } = await supabase
    .from("channels")
    .select("id, name, description")
    .order("name");

  // Get user's memberships (only for non-admin)
  let memberChannelIds: string[] = [];
  if (user && !userIsAdmin) {
    const { data: memberships } = await supabase
      .from("channel_members")
      .select("channel_id")
      .eq("user_id", user.id);
    memberChannelIds = memberships?.map((m) => m.channel_id) || [];
  }

  return (
    <div>
      <p className="mb-6">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-400">
          ← Home
        </Link>
      </p>
      <p className="text-zinc-500 text-[15px]">
        {userIsAdmin ? "All channels." : "Join a channel to see and bet on its markets."}
      </p>
      <ul className="mt-8 space-y-2">
        {channels?.map((ch) => {
          const joined = memberChannelIds.includes(ch.id);
          return (
            <li key={ch.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/channels/${ch.id}`}
                      className="font-medium text-zinc-200 hover:text-white"
                    >
                      {ch.name}
                    </Link>
                    {ch.description && (
                      <p className="mt-0.5 text-xs text-zinc-600">
                        {ch.description}
                      </p>
                    )}
                  </div>
                  {!userIsAdmin && (
                    joined ? (
                      <span className="text-xs font-medium text-emerald-400">Joined</span>
                    ) : (
                      <JoinButton channelId={ch.id} />
                    )
                  )}
                </div>
              </Card>
            </li>
          );
        })}
        {!channels || channels.length === 0 ? (
          <p className="text-sm text-zinc-500">No channels yet.</p>
        ) : null}
      </ul>
    </div>
  );
}
