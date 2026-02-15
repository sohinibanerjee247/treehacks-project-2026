import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { ROUTES } from "@/lib/constants";
import ChannelSearch from "./ChannelSearch";

export default async function ChannelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIsAdmin = await isAdmin();

  // Get all channels
  const { data: channels } = await supabase
    .from("channels")
    .select("id, name, description")
    .order("name");

  // Get member counts
  const channelIds = channels?.map((c) => c.id) ?? [];
  const { data: allMembers } = channelIds.length
    ? await supabase
        .from("channel_members")
        .select("channel_id")
        .in("channel_id", channelIds)
    : { data: [] };

  const memberCounts: Record<string, number> = {};
  allMembers?.forEach((m) => {
    memberCounts[m.channel_id] = (memberCounts[m.channel_id] || 0) + 1;
  });

  // Get user's memberships (only for non-admin)
  let memberChannelIds: string[] = [];
  if (user && !userIsAdmin) {
    const { data: memberships } = await supabase
      .from("channel_members")
      .select("channel_id")
      .eq("user_id", user.id);
    memberChannelIds = memberships?.map((m) => m.channel_id) || [];
  }

  // Build channel list for the client component
  const channelList = (channels ?? []).map((ch) => ({
    id: ch.id,
    name: ch.name,
    description: ch.description,
    joined: memberChannelIds.includes(ch.id),
    memberCount: memberCounts[ch.id] || 0,
  }));

  return (
    <div>
      <p className="mb-6">
        <Link href={ROUTES.DASHBOARD} className="text-sm text-zinc-500 hover:text-zinc-400">
          ← Dashboard
        </Link>
      </p>

      <h1 className="text-2xl font-semibold text-zinc-100">Communities</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {userIsAdmin
          ? "All channels."
          : "Join a community to see its markets and start betting."}
      </p>

      <ChannelSearch
        channels={channelList}
        showJoin={!userIsAdmin && !!user}
        showSignIn={!user}
      />
    </div>
  );
}
