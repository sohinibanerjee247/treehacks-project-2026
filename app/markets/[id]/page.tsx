import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { Card } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import { yesPrice as calcYesPrice, noPrice as calcNoPrice } from "@/lib/market";
import TradeForm from "./TradeForm";
import ResolveButtons from "./ResolveButtons";

type Props = { params: { id: string } };

export default async function MarketPage({ params }: Props) {
  const { id: marketId } = params;
  const supabase = await createClient();
  const userIsAdmin = await isAdmin();

  // Fetch market
  const { data: market, error } = await supabase
    .from("markets")
    .select(`
      *,
      channel:channels(id, name)
    `)
    .eq("id", marketId)
    .single();

  if (error || !market) {
    return (
      <div>
        <p className="text-zinc-500">Market not found.</p>
        <Link href={ROUTES.CHANNELS} className="text-sm text-zinc-400 hover:text-zinc-300">
          ← Back to communities
        </Link>
      </div>
    );
  }

  const yp = (market.yes_pool ?? 0) > 0 ? market.yes_pool : 10000;
  const np = (market.no_pool ?? 0) > 0 ? market.no_pool : 10000;
  const yPrice = calcYesPrice(yp, np);
  const nPrice = calcNoPrice(yp, np);
  const { data: bets } = await supabase
    .from("bets")
    .select("amount, type")
    .eq("market_id", marketId);
  // Visible pool = real money bet by users (exclude sell records)
  const visiblePool = (bets ?? [])
    .filter((b: any) => b.type !== "sell")
    .reduce((sum: number, b: any) => sum + (b.amount ?? 0), 0);

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get user position and balance
  let userBalance = 0;
  let position = { yes_shares: 0, no_shares: 0 };

  if (user && !userIsAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();
    userBalance = profile?.balance ?? 0;

    const { data: pos } = await supabase
      .from("positions")
      .select("yes_shares, no_shares")
      .eq("user_id", user.id)
      .eq("market_id", marketId)
      .maybeSingle();
    if (pos) {
      position = { yes_shares: pos.yes_shares, no_shares: pos.no_shares };
    }
  }

  return (
    <div>
      <p className="mb-6">
        <Link
          href={ROUTES.CHANNEL(market.channel_id)}
          className="text-sm text-zinc-500 hover:text-zinc-400"
        >
          ← Back to {market.channel?.name || "channel"}
        </Link>
      </p>

      <Card className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-100 leading-snug">
          {market.title}
        </h1>
        {market.description && (
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
            {market.description}
          </p>
        )}

        {/* Price display as percentages */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 py-4 text-center">
            <p className="text-[11px] uppercase tracking-wider text-emerald-400">
              Yes
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-emerald-300">
              {(yPrice * 100).toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {(yPrice * 100).toFixed(0)}¢ per share
            </p>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 py-4 text-center">
            <p className="text-[11px] uppercase tracking-wider text-red-400">
              No
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-red-300">
              {(nPrice * 100).toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {(nPrice * 100).toFixed(0)}¢ per share
            </p>
          </div>
        </div>

        {/* Pool and position info */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
          <span>Pool: ${(visiblePool / 100).toFixed(2)}</span>
          {!userIsAdmin && (position.yes_shares > 0 || position.no_shares > 0) && (
            <span>
              Your position: {position.yes_shares.toFixed(1)} YES / {position.no_shares.toFixed(1)} NO
            </span>
          )}
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
          Market Details
        </h2>
        {market.rules && (
          <div className="mt-3">
            <p className="text-xs font-medium text-zinc-400">Rules</p>
            <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{market.rules}</p>
          </div>
        )}
        {market.resolution_source && (
          <div className="mt-3">
            <p className="text-xs font-medium text-zinc-400">Resolution Source</p>
            <p className="mt-1 text-sm text-zinc-300">{market.resolution_source}</p>
          </div>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-zinc-400">Close Time</p>
            <p className="mt-1 text-sm text-zinc-300">
              {market.close_time
                ? new Date(market.close_time).toLocaleString()
                : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">Expected Resolution</p>
            <p className="mt-1 text-sm text-zinc-300">
              {market.expected_resolution_time
                ? new Date(market.expected_resolution_time).toLocaleString()
                : "Not set"}
            </p>
          </div>
        </div>
      </Card>

      {/* Admin: resolve */}
      {userIsAdmin && !market.resolved && (
        <ResolveButtons marketId={marketId} marketTitle={market.title} />
      )}

      {/* User: trade */}
      {!userIsAdmin && user && !market.resolved && (
        <TradeForm
          marketId={marketId}
          balance={userBalance}
          yesPrice={yPrice}
          noPrice={nPrice}
          position={position}
        />
      )}

      {/* Resolved badge */}
      {market.resolved && (
        <Card className="text-center">
          <p className="text-sm text-zinc-400">
            Resolved{" "}
            <span
              className={`text-base font-semibold ${
                market.outcome === "YES"
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {market.outcome}
            </span>
          </p>
          {market.resolved_at && (
            <p className="mt-1 text-xs text-zinc-600">
              on {new Date(market.resolved_at).toLocaleDateString()}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
