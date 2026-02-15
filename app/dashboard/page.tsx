import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { ROUTES } from "@/lib/constants";
import { Card } from "@/components/ui";
import Button from "@/components/ui/Button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const userIsAdmin = await isAdmin();

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance, username")
    .eq("id", user.id)
    .single();

  const displayName = profile?.username || user.email?.split("@")[0] || "there";

  // ADMIN VIEW
  if (userIsAdmin) {
    // Get all channels
    const { data: channels } = await supabase
      .from("channels")
      .select("id, name, description")
      .order("name");

    // Get all markets
    const { data: markets } = await supabase
      .from("markets")
      .select(`
        id,
        title,
        resolved,
        outcome,
        channel:channels(name)
      `)
      .order("created_at", { ascending: false })
      .limit(20);
    const activeMarkets = (markets ?? []).filter((m: any) => !m.resolved);
    const resolvedMarkets = (markets ?? []).filter((m: any) => m.resolved);

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage channels and markets.
          </p>
        </div>

        <div className="mb-6 flex gap-3">
          <Link href={ROUTES.ADMIN_CREATE_CHANNEL}>
            <Button variant="primary">Create channel</Button>
          </Link>
          <Link href={ROUTES.ADMIN_CREATE_MARKET}>
            <Button variant="primary">Create market</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* All Channels */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">All channels</h2>
            {channels && channels.length > 0 ? (
              <ul className="space-y-2">
                {channels.map((ch) => (
                  <li key={ch.id}>
                    <Card className="p-3">
                      <Link
                        href={ROUTES.CHANNEL(ch.id)}
                        className="font-medium text-zinc-200 hover:text-white"
                      >
                        {ch.name}
                      </Link>
                      {ch.description && (
                        <p className="mt-1 text-xs text-zinc-600">{ch.description}</p>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <Card className="p-4 text-center">
                <p className="text-sm text-zinc-500">No channels yet.</p>
              </Card>
            )}
          </div>

          {/* All Markets */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">Markets</h2>
            {markets && markets.length > 0 ? (
              <div className="space-y-6">
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Active
                  </h3>
                  {activeMarkets.length === 0 ? (
                    <p className="text-sm text-zinc-500">No active markets.</p>
                  ) : (
                    <ul className="space-y-2">
                      {activeMarkets.map((m: any) => (
                        <li key={m.id}>
                          <Card className="p-3">
                            <Link
                              href={ROUTES.MARKET(m.id)}
                              className="block text-sm font-medium text-zinc-200 hover:text-white"
                            >
                              {m.title}
                            </Link>
                            <div className="mt-1 text-xs text-zinc-600">{m.channel?.name}</div>
                          </Card>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Resolved
                  </h3>
                  {resolvedMarkets.length === 0 ? (
                    <p className="text-sm text-zinc-500">No resolved markets yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {resolvedMarkets.map((m: any) => (
                        <li key={m.id}>
                          <Card className="p-3">
                            <Link
                              href={ROUTES.MARKET(m.id)}
                              className="block text-sm font-medium text-zinc-200 hover:text-white"
                            >
                              {m.title}
                            </Link>
                            <div className="mt-1 text-xs text-zinc-600">
                              {m.channel?.name}
                              <span
                                className={`ml-2 rounded px-1.5 py-0.5 font-medium ${
                                  m.outcome === "YES"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                              >
                                {m.outcome}
                              </span>
                            </div>
                          </Card>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ) : (
              <Card className="p-4 text-center">
                <p className="text-sm text-zinc-500">No markets yet.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // NORMAL USER VIEW
  // Get user's bets
  const { data: bets } = await supabase
    .from("bets")
    .select(`
      *,
      market:markets(id, title, resolved, outcome)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get user's channels
  const { data: memberships } = await supabase
    .from("channel_members")
    .select("channel:channels(id, name)")
    .eq("user_id", user.id);

  // Get recent markets from joined channels
  const joinedChannelIds =
    memberships?.map((m: any) => m.channel?.id).filter(Boolean) ?? [];
  const { data: joinedMarkets } = joinedChannelIds.length
    ? await supabase
        .from("markets")
        .select("id, title, resolved, outcome, channel_id, channel:channels(name)")
        .in("channel_id", joinedChannelIds)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] as any[] };
  const activeJoinedMarkets = (joinedMarkets ?? []).filter((m: any) => !m.resolved);
  const resolvedJoinedMarkets = (joinedMarkets ?? []).filter((m: any) => m.resolved);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">
          Welcome, {displayName}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Balance: ${((profile?.balance ?? 1000) / 100).toFixed(2)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Channels */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">My channels</h2>
          {memberships && memberships.length > 0 ? (
            <ul className="space-y-2">
              {memberships.map((m: any) => (
                <li key={m.channel.id}>
                  <Card className="p-3">
                    <Link
                      href={ROUTES.CHANNEL(m.channel.id)}
                      className="font-medium text-zinc-200 hover:text-white"
                    >
                      {m.channel.name}
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <Card className="p-4 text-center">
              <p className="text-sm text-zinc-500">You haven't joined any channels yet.</p>
              <Link href={ROUTES.CHANNELS} className="mt-2 inline-block">
                <Button variant="secondary">Browse channels</Button>
              </Link>
            </Card>
          )}
        </div>

        {/* My Bets */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">Recent bets</h2>
          {bets && bets.length > 0 ? (
            <ul className="space-y-2">
              {bets.map((bet: any) => (
                <li key={bet.id}>
                  <Card className="p-3">
                    <Link
                      href={ROUTES.MARKET(bet.market_id)}
                      className="block text-sm font-medium text-zinc-200 hover:text-white"
                    >
                      {bet.market?.title || "Market"}
                    </Link>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 font-medium ${
                          bet.side === "YES"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {bet.side}
                      </span>
                      <span>${(bet.amount / 100).toFixed(2)}</span>
                      {bet.market?.resolved && (
                        <span
                          className={`ml-auto font-medium ${
                            bet.market.outcome === bet.side
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {bet.market.outcome === bet.side ? "Won" : "Lost"}
                        </span>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <Card className="p-4 text-center">
              <p className="text-sm text-zinc-500">You haven't placed any bets yet.</p>
              <Link href={ROUTES.CHANNELS} className="mt-2 inline-block">
                <Button variant="secondary">Find markets</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Recent markets</h2>
        {joinedMarkets && joinedMarkets.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Active
              </h3>
              {activeJoinedMarkets.length === 0 ? (
                <p className="text-sm text-zinc-500">No active markets.</p>
              ) : (
                <ul className="space-y-2">
                  {activeJoinedMarkets.map((m: any) => (
                    <li key={m.id}>
                      <Card className="p-3">
                        <Link
                          href={ROUTES.MARKET(m.id)}
                          className="block text-sm font-medium text-zinc-200 hover:text-white"
                        >
                          {m.title}
                        </Link>
                        <div className="mt-1 text-xs text-zinc-600">{m.channel?.name}</div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Resolved
              </h3>
              {resolvedJoinedMarkets.length === 0 ? (
                <p className="text-sm text-zinc-500">No resolved markets yet.</p>
              ) : (
                <ul className="space-y-2">
                  {resolvedJoinedMarkets.map((m: any) => (
                    <li key={m.id}>
                      <Card className="p-3">
                        <Link
                          href={ROUTES.MARKET(m.id)}
                          className="block text-sm font-medium text-zinc-200 hover:text-white"
                        >
                          {m.title}
                        </Link>
                        <div className="mt-1 text-xs text-zinc-600">
                          {m.channel?.name}
                          <span
                            className={`ml-2 rounded px-1.5 py-0.5 font-medium ${
                              m.outcome === "YES"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {m.outcome}
                          </span>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <Card className="p-4 text-center">
            <p className="text-sm text-zinc-500">No markets from your channels yet.</p>
          </Card>
        )}
      </section>
    </div>
  );
}
