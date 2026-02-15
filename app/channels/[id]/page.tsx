import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { Card } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import RenameChannelButton from "./RenameChannelButton";
import JoinButton from "../JoinButton";

type Props = { params: { id: string } };

export default async function ChannelPage({ params }: Props) {
  const { id: channelId } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIsAdmin = await isAdmin();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Get channel info
  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("id, name, description")
    .eq("id", channelId)
    .single();

  if (channelError || !channel) {
    return (
      <div>
        <p className="text-zinc-500">Channel not found.</p>
        <Link href={ROUTES.CHANNELS} className="text-sm text-zinc-400 hover:text-zinc-300">
          ← Back to communities
        </Link>
      </div>
    );
  }

  // Check membership for non-admin users
  let isMember = false;
  if (!userIsAdmin) {
    const { data: membership } = await supabase
      .from("channel_members")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("channel_id", channelId)
      .maybeSingle();
    isMember = !!membership;
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from("channel_members")
    .select("*", { count: "exact", head: true })
    .eq("channel_id", channelId);

  // Get markets in this channel with pool state
  const { data: markets } = await supabase
    .from("markets")
    .select("id, title, description, resolved, outcome, yes_pool, no_pool")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false });

  // Use CPMM pricing from pool state (fallback to 50/50 if no pools set)
  const marketOdds = markets?.map((m) => {
    const yp = m.yes_pool ?? 10000;
    const np = m.no_pool ?? 10000;
    const total = yp + np;
    const yesPercent = total > 0 ? (np / total) * 100 : 50;
    const noPercent = total > 0 ? (yp / total) * 100 : 50;
    return {
      ...m,
      yesOdds: yesPercent,
      noOdds: noPercent,
      totalPool: total,
    };
  });

  const activeMarkets = (marketOdds ?? []).filter((m) => !m.resolved);
  const resolvedMarkets = (marketOdds ?? []).filter((m) => m.resolved);

  return (
    <div>
      <p className="mb-6">
        <Link
          href={ROUTES.CHANNELS}
          className="text-sm text-zinc-500 hover:text-zinc-400"
        >
          ← Communities
        </Link>
      </p>

      {/* Channel header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">{channel.name}</h1>
          {channel.description && (
            <p className="mt-1 text-sm text-zinc-500">{channel.description}</p>
          )}
          <p className="mt-2 text-xs text-zinc-600">
            {memberCount ?? 0} {memberCount === 1 ? "member" : "members"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userIsAdmin ? (
            <RenameChannelButton
              channelId={channelId}
              currentName={channel.name}
              currentDescription={channel.description ?? ""}
            />
          ) : (
            <JoinButton channelId={channelId} joined={isMember} />
          )}
        </div>
      </div>

      {/* Not a member prompt */}
      {!userIsAdmin && !isMember && (
        <Card className="p-8 text-center">
          <p className="text-zinc-400">Join this community to see its markets and place bets.</p>
        </Card>
      )}

      {/* Markets (visible to members and admins) */}
      {(userIsAdmin || isMember) && (
        <>
          {!markets || markets.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-zinc-500">No markets in this community yet.</p>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Active markets */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                  Active Markets
                </h2>
                {activeMarkets.length === 0 ? (
                  <p className="text-sm text-zinc-500">No active markets.</p>
                ) : (
                  <ul className="space-y-3">
                    {activeMarkets.map((m) => (
                      <li key={m.id}>
                        <Link href={ROUTES.MARKET(m.id)}>
                          <Card className="p-4 hover:border-accent/40 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-zinc-200">
                                  {m.title}
                                </h3>
                                {m.totalPool > 0 && (
                                  <p className="mt-1 text-xs text-zinc-600">
                                    ${(m.totalPool / 100).toFixed(2)} in pool
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-3 text-right">
                                <div>
                                  <div className="text-lg font-semibold text-emerald-400">
                                    {m.yesOdds.toFixed(1)}%
                                  </div>
                                  <div className="text-[10px] uppercase text-zinc-500">Yes</div>
                                </div>
                                <div>
                                  <div className="text-lg font-semibold text-red-400">
                                    {m.noOdds.toFixed(1)}%
                                  </div>
                                  <div className="text-[10px] uppercase text-zinc-500">No</div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Resolved markets */}
              {resolvedMarkets.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                    Resolved
                  </h2>
                  <ul className="space-y-3">
                    {resolvedMarkets.map((m) => (
                      <li key={m.id}>
                        <Link href={ROUTES.MARKET(m.id)}>
                          <Card className="p-4 hover:border-accent/40 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between gap-4">
                              <h3 className="font-medium text-zinc-200">
                                {m.title}
                              </h3>
                              <span
                                className={`rounded-md px-2.5 py-1 text-sm font-semibold ${
                                  m.outcome === "YES"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                              >
                                {m.outcome}
                              </span>
                            </div>
                          </Card>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
