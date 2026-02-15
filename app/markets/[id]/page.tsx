import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { Card } from "@/components/ui";
import BetForm from "./BetForm";
import ResolveButtons from "./ResolveButtons";

type Props = { params: { id: string } };

export default async function MarketPage({ params }: Props) {
  const { id: marketId } = params;
  const supabase = await createClient();
  const userIsAdmin = await isAdmin();

  // Fetch market from database
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
        <Link href="/channels" className="text-sm text-zinc-400 hover:text-zinc-300">
          ← Back to channels
        </Link>
      </div>
    );
  }

  // Get bets to calculate odds
  const { data: bets } = await supabase
    .from("bets")
    .select("*")
    .eq("market_id", marketId);

  const totalYes = bets?.filter((b) => b.side === "YES").reduce((sum, b) => sum + b.amount, 0) || 0;
  const totalNo = bets?.filter((b) => b.side === "NO").reduce((sum, b) => sum + b.amount, 0) || 0;
  const total = totalYes + totalNo;
  const yesOdds = total > 0 ? Math.round((totalYes / total) * 100) : 50;
  const noOdds = total > 0 ? Math.round((totalNo / total) * 100) : 50;

  // Get current user (only for non-admin)
  const { data: { user } } = await supabase.auth.getUser();
  
  // Non-admin: get position and balance
  let myYes = 0;
  let myNo = 0;
  let userBalance = 1000;
  
  if (user && !userIsAdmin) {
    const myBets = bets?.filter((b) => b.user_id === user.id) || [];
    myYes = myBets.filter((b) => b.side === "YES").reduce((sum, b) => sum + b.amount, 0);
    myNo = myBets.filter((b) => b.side === "NO").reduce((sum, b) => sum + b.amount, 0);

    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();
    userBalance = profile?.balance ?? 1000;
  }

  return (
    <div>
      <p className="mb-6">
        <Link
          href={`/channels/${market.channel_id}`}
          className="text-sm text-zinc-500 hover:text-zinc-400"
        >
          ← Back to {market.channel?.name || "channel"}
        </Link>
      </p>

      <Card className="mb-6">
        <h1 className="text-[17px] font-medium text-zinc-100 leading-snug">
          {market.title}
        </h1>
        {market.description && (
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
            {market.description}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-zinc-800/80 bg-zinc-900/20 py-4 text-center">
            <p className="text-[11px] uppercase tracking-wider text-emerald-400">
              Yes
            </p>
            <p className="mt-1 text-xl font-medium tabular-nums text-emerald-300">
              {yesOdds}¢
            </p>
          </div>
          <div className="rounded-md border border-zinc-800/80 bg-zinc-900/20 py-4 text-center">
            <p className="text-[11px] uppercase tracking-wider text-red-400">
              No
            </p>
            <p className="mt-1 text-xl font-medium tabular-nums text-red-300">
              {noOdds}¢
            </p>
          </div>
        </div>
        
        {/* Show position only for non-admin users */}
        {!userIsAdmin && (myYes > 0 || myNo > 0) && (
          <p className="mt-3 text-xs text-zinc-600">
            Your position: Yes ${(myYes / 100).toFixed(2)} · No ${(myNo / 100).toFixed(2)}
          </p>
        )}
        
        {/* Show pool info for admin */}
        {userIsAdmin && (
          <p className="mt-3 text-xs text-zinc-600">
            Total pool: ${(total / 100).toFixed(2)} (Yes: ${(totalYes / 100).toFixed(2)}, No: ${(totalNo / 100).toFixed(2)})
          </p>
        )}
      </Card>

      {/* ADMIN VIEW: Only resolve, no betting */}
      {userIsAdmin ? (
        <>
          {!market.resolved && (
            <ResolveButtons marketId={marketId} marketTitle={market.title} />
          )}
          {market.resolved && (
            <p className="text-sm text-zinc-600">
              Resolved{" "}
              <span
                className={
                  market.outcome === "YES"
                    ? "text-emerald-400 font-medium"
                    : "text-red-400 font-medium"
                }
              >
                {market.outcome === "YES" ? "YES" : "NO"}
              </span>{" "}
              on{" "}
              {new Date(market.resolved_at).toLocaleDateString()}.
            </p>
          )}
        </>
      ) : (
        /* NORMAL USER VIEW: Only betting, no resolve */
        <>
          {!market.resolved && user && (
            <BetForm marketId={marketId} balance={userBalance} />
          )}
          {market.resolved && (
            <p className="text-sm text-zinc-600">
              Resolved{" "}
              <span
                className={
                  market.outcome === "YES"
                    ? "text-emerald-400 font-medium"
                    : "text-red-400 font-medium"
                }
              >
                {market.outcome === "YES" ? "YES" : "NO"}
              </span>{" "}
              on{" "}
              {new Date(market.resolved_at).toLocaleDateString()}.
            </p>
          )}
        </>
      )}
    </div>
  );
}
