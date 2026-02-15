"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { Card } from "@/components/ui";

type Bet = {
  id: string;
  side: string;
  amount: number;
  type: string;
  created_at: string;
  market: {
    id: string;
    title: string;
    resolved: boolean;
    outcome: string | null;
  };
};

type Props = {
  bets: Bet[];
};

export default function BetHistory({ bets }: Props) {
  if (!bets || bets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-zinc-500">No trades yet.</p>
        <Link href={ROUTES.CHANNELS} className="mt-2 inline-block text-sm text-accent hover:text-accent-hover">
          Find markets
        </Link>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {bets.map((bet) => {
        const isWin = bet.market.resolved && bet.market.outcome === bet.side;
        const isLoss = bet.market.resolved && bet.market.outcome !== bet.side;

        return (
          <li key={bet.id}>
            <Card className="p-3">
              <Link
                href={ROUTES.MARKET(bet.market.id)}
                className="block text-sm font-medium text-zinc-200 hover:text-white"
              >
                {bet.market.title}
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {/* Action type */}
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-medium text-zinc-400">
                  {bet.type === "sell" ? "Reduced" : "Placed"}
                </span>

                {/* Side */}
                <span
                  className={`rounded px-1.5 py-0.5 font-medium ${
                    bet.side === "YES"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {bet.side}
                </span>

                {/* Amount */}
                <span className="text-zinc-500">
                  ${(bet.amount / 100).toFixed(2)}
                </span>

                {/* Status */}
                {bet.market.resolved && (
                  <span
                    className={`ml-auto font-semibold ${
                      isWin
                        ? "text-emerald-400"
                        : isLoss
                          ? "text-red-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {isWin ? "Won" : isLoss ? "Lost" : "Resolved"}
                  </span>
                )}
                {!bet.market.resolved && (
                  <span className="ml-auto text-zinc-600">Active</span>
                )}
              </div>

              {/* Timestamp */}
              <p className="mt-1.5 text-xs text-zinc-600">
                {new Date(bet.created_at).toLocaleString()}
              </p>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
