import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { Card } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import BetForm from "./BetForm";
import ResolveButtons from "./ResolveButtons";
import MarketLive from "./MarketLive";
import SentimentChart from "./SentimentChart";
import DiscussionThread from "./DiscussionThread";

// Force dynamic rendering — sentiment changes with every bet/order
export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function MarketPage({ params }: Props) {
  const { id: marketId } = params;
  const supabase = await createClient();
  const admin = createAdminClient();
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

  // IMPORTANT: sentiment must be consistent across users.
  // Bets/orders may be RLS-protected (users can only read their own), so we use the
  // admin (service-role) client to compute aggregates for the market.
  const { data: allBets } = await admin
    .from("bets")
    .select("side, amount, created_at")
    .eq("market_id", marketId)
    .order("created_at", { ascending: true });

  // Get ALL orders (pending + filled) — resting orders reflect market interest
  const { data: allOrders } = await admin
    .from("orders")
    .select("side, amount, filled_amount, status, created_at")
    .eq("market_id", marketId)
    .in("status", ["pending", "filled"])
    .order("created_at", { ascending: true });

  // Calculate sentiment from BOTH executed bets + pending order amounts
  // This gives the full picture of market interest
  const betYesAmt = (allBets ?? [])
    .filter(b => b.side === "YES")
    .reduce((sum, b) => sum + (b.amount ?? 0), 0);
  const betNoAmt = (allBets ?? [])
    .filter(b => b.side === "NO")
    .reduce((sum, b) => sum + (b.amount ?? 0), 0);
  const pendingYesAmt = (allOrders ?? [])
    .filter((o: any) => o.side === "YES" && o.status === "pending")
    .reduce((sum: number, o: any) => sum + ((o.amount ?? 0) - (o.filled_amount ?? 0)), 0);
  const pendingNoAmt = (allOrders ?? [])
    .filter((o: any) => o.side === "NO" && o.status === "pending")
    .reduce((sum: number, o: any) => sum + ((o.amount ?? 0) - (o.filled_amount ?? 0)), 0);

  const totalYes = betYesAmt + pendingYesAmt;
  const totalNo = betNoAmt + pendingNoAmt;
  const totalInterest = totalYes + totalNo;

  // Fallback/freeze source: pool snapshot.
  // In this CPMM representation, YES probability is derived from the NO pool.
  const poolYes = Number(market.no_pool ?? 0);
  const poolNo = Number(market.yes_pool ?? 0);
  const poolTotal = poolYes + poolNo;
  const poolYesPrice = poolTotal > 0 ? poolYes / poolTotal : 0.5;

  const liveYesPrice = totalInterest > 0 ? totalYes / totalInterest : poolYesPrice;
  const yPrice = market.resolved && poolTotal > 0 ? poolYesPrice : liveYesPrice;
  const nPrice = 1 - yPrice;

  // Build chart data from combined bets + orders chronologically
  type Activity = { side: string; amount: number; created_at: string };
  const allActivity: Activity[] = [
    ...(allBets ?? []).map(b => ({ side: b.side, amount: b.amount ?? 0, created_at: b.created_at })),
    ...(allOrders ?? []).map((o: any) => ({ side: o.side, amount: o.amount ?? 0, created_at: o.created_at })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const chartData: { time: string; yes: number }[] = [];
  let runYesAmt = 0;
  let runTotalAmt = 0;
  for (const act of allActivity) {
    runTotalAmt += act.amount;
    if (act.side === "YES") runYesAmt += act.amount;
    chartData.push({
      time: act.created_at,  // pass raw ISO string — client formats in local tz
      yes: runTotalAmt > 0 ? Math.round((runYesAmt / runTotalAmt) * 100) : 50,
    });
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get user balance
  let userBalance = 0;

  if (user && !userIsAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();
    userBalance = profile?.balance ?? 0;
  }

  // Fetch comments for the discussion thread
  const { data: rawComments } = await supabase
    .from("market_comments")
    .select("id, content, created_at, user_id")
    .eq("market_id", marketId)
    .order("created_at", { ascending: true });

  // Batch-fetch usernames for comment authors
  const commentUserIds = Array.from(new Set((rawComments ?? []).map(c => c.user_id)));
  const { data: commentProfiles } = commentUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, username")
        .in("id", commentUserIds)
    : { data: [] as any[] };

  const profileMap = new Map(
    (commentProfiles ?? []).map((p: any) => [p.id, p.username])
  );

  const comments = (rawComments ?? []).map(c => ({
    ...c,
    username: profileMap.get(c.user_id) ?? null,
  }));

  return (
    <div>
      {/* Real-time subscription — refreshes page on new bets/orders */}
      <MarketLive marketId={marketId} />

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
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 py-4 text-center">
            <p className="text-[11px] uppercase tracking-wider text-red-400">
              No
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-red-300">
              {(nPrice * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Sentiment Chart */}
      {chartData.length > 1 && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-300">
            Sentiment Over Time
          </h2>
          <SentimentChart data={chartData} />
        </Card>
      )}

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

      {/* User: bet */}
      {!userIsAdmin && user && !market.resolved && (
        <BetForm
          marketId={marketId}
          balance={userBalance}
          yesPercent={yPrice * 100}
          noPercent={nPrice * 100}
        />
      )}

      {/* Resolved badge */}
      {market.resolved && (
        <Card className="text-center mb-6">
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

      {/* Discussion Thread */}
      {user && (
        <DiscussionThread
          marketId={marketId}
          comments={(comments as any) ?? []}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
