import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { Card } from "@/components/ui";
import RenameChannelButton from "./RenameChannelButton";

type Props = { params: { id: string } };

export default async function ChannelPage({ params }: Props) {
  const { id: channelId } = params;
  const supabase = await createClient();
  const userIsAdmin = await isAdmin();

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
        <Link href="/channels" className="text-sm text-zinc-400 hover:text-zinc-300">
          ← Back to channels
        </Link>
      </div>
    );
  }

  // Get markets in this channel
  const { data: markets } = await supabase
    .from("markets")
    .select("id, title, description, resolved, outcome")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false });

  // Get bets to calculate odds for each market
  const marketIds = markets?.map((m) => m.id) || [];
  const { data: allBets } = await supabase
    .from("bets")
    .select("market_id, side, amount")
    .in("market_id", marketIds);

  const marketOdds = markets?.map((m) => {
    const bets = allBets?.filter((b) => b.market_id === m.id) || [];
    const totalYes = bets.filter((b) => b.side === "YES").reduce((sum, b) => sum + b.amount, 0);
    const totalNo = bets.filter((b) => b.side === "NO").reduce((sum, b) => sum + b.amount, 0);
    const total = totalYes + totalNo;
    return {
      ...m,
      yesOdds: total > 0 ? Math.round((totalYes / total) * 100) : 50,
      noOdds: total > 0 ? Math.round((totalNo / total) * 100) : 50,
    };
  });
  const activeMarkets = (marketOdds ?? []).filter((m) => !m.resolved);
  const resolvedMarkets = (marketOdds ?? []).filter((m) => m.resolved);

  return (
    <div>
      <p className="mb-6">
        <Link
          href="/channels"
          className="text-sm text-zinc-500 hover:text-zinc-400"
        >
          ← Channels
        </Link>
      </p>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">{channel.name}</h1>
          {channel.description && (
            <p className="mt-1 text-sm text-zinc-500">{channel.description}</p>
          )}
        </div>
        {userIsAdmin && (
          <RenameChannelButton channelId={channelId} currentName={channel.name} currentDescription={channel.description ?? ""} />
        )}
      </div>
      {!markets || markets.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">No markets in this channel yet.</p>
      ) : (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">Active Markets</h2>
            {activeMarkets.length === 0 ? (
              <p className="text-sm text-zinc-500">No active markets.</p>
            ) : (
              <ul className="space-y-2">
                {activeMarkets.map((m) => (
                  <li key={m.id}>
                    <Card className="p-4">
                      <Link
                        href={`/markets/${m.id}`}
                        className="block font-medium text-zinc-200 hover:text-white"
                      >
                        {m.title}
                      </Link>
                      <p className="mt-1.5 text-xs text-zinc-600">
                        <span className="text-emerald-400">Yes {m.yesOdds}¢</span>
                        {" · "}
                        <span className="text-red-400">No {m.noOdds}¢</span>
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">Resolved Markets</h2>
            {resolvedMarkets.length === 0 ? (
              <p className="text-sm text-zinc-500">No resolved markets yet.</p>
            ) : (
              <ul className="space-y-2">
                {resolvedMarkets.map((m) => (
                  <li key={m.id}>
                    <Card className="p-4">
                      <Link
                        href={`/markets/${m.id}`}
                        className="block font-medium text-zinc-200 hover:text-white"
                      >
                        {m.title}
                      </Link>
                      <p className="mt-1.5 text-xs text-zinc-600">
                        <span className="text-emerald-400">Yes {m.yesOdds}¢</span>
                        {" · "}
                        <span className="text-red-400">No {m.noOdds}¢</span>
                        <span className="ml-1.5">
                          · Resolved{" "}
                          <span
                            className={
                              m.outcome === "YES"
                                ? "text-emerald-400 font-medium"
                                : "text-red-400 font-medium"
                            }
                          >
                            {m.outcome === "YES" ? "YES" : "NO"}
                          </span>
                        </span>
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
