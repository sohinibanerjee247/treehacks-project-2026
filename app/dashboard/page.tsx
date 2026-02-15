import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { ROUTES } from "@/lib/constants";
import { Card } from "@/components/ui";
import Button from "@/components/ui/Button";
import BetHistory from "./BetHistory";
import PendingOrders from "./PendingOrders";
import SuccessBanner from "./SuccessBanner";

type Props = {
  searchParams?: { trade_success?: string };
};

export default async function DashboardPage({ searchParams }: Props) {
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
    const { data: channels } = await supabase
      .from("channels")
      .select("id, name, description")
      .order("name");

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
      {searchParams?.trade_success && (
        <SuccessBanner message={searchParams.trade_success} />
      )}
      
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
  // Get executed bets
  const { data: bets } = await supabase
    .from("bets")
    .select(`
      id,
      side,
      amount,
      created_at,
      market:markets!inner(id, title, resolved, outcome, channel:channels!inner(name))
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Get pending orders
  const { data: pendingOrders } = await supabase
    .from("orders")
    .select(`
      id,
      side,
      amount,
      filled_amount,
      created_at,
      market:markets!inner(id, title, channel:channels!inner(name))
    `)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Get user's channels
  const { data: memberships } = await supabase
    .from("channel_members")
    .select("channel:channels(id, name)")
    .eq("user_id", user.id);

  return (
    <div>
      {searchParams?.trade_success && (
        <SuccessBanner message={searchParams.trade_success} />
      )}

      <div className="mb-8 border-b border-zinc-800/80 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          Welcome, {displayName}
        </h1>
        <p className="mt-2 text-zinc-400">
          Balance: <span className="font-semibold text-accent">${((profile?.balance ?? 1000) / 100).toFixed(2)}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending orders */}
          {((pendingOrders as any) ?? []).length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-100">Pending</h2>
              </div>
              <PendingOrders orders={(pendingOrders as any) ?? []} />
            </section>
          )}

          {/* Executed bets */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-100">My Bets</h2>
            </div>
            <BetHistory bets={(bets as any) ?? []} />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* My communities */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">My Communities</h2>
            {memberships && memberships.length > 0 ? (
              <ul className="space-y-2">
                {memberships.map((m: any) => (
                  <li key={m.channel.id}>
                    <Card className="p-3">
                      <Link
                        href={ROUTES.CHANNEL(m.channel.id)}
                        className="text-sm font-medium text-zinc-200 hover:text-white"
                      >
                        {m.channel.name}
                      </Link>
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <Card className="p-4 text-center">
                <p className="text-xs text-zinc-500">No communities yet.</p>
                <Link href={ROUTES.CHANNELS} className="mt-2 inline-block">
                  <Button variant="secondary">Browse</Button>
                </Link>
              </Card>
            )}
          </section>

          {/* Quick actions */}
          <section>
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-zinc-100 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href={ROUTES.CHANNELS} className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    Browse Communities
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
