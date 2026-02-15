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
    channel?: {
      name: string;
    };
  };
};

type Props = {
  bets: Bet[];
};

export default function BetHistory({ bets }: Props) {
  if (!bets || bets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-zinc-500">No bets yet.</p>
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
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={ROUTES.MARKET(bet.market.id)}
                    className="block text-sm font-medium text-zinc-200 hover:text-white line-clamp-1"
                  >
                    {bet.market.title}
                  </Link>
                  {bet.market.channel && (
                    <p className="mt-0.5 text-xs text-zinc-600">
                      {bet.market.channel.name}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-semibold text-zinc-100">
                    ${(bet.amount / 100).toFixed(2)}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      bet.side === "YES"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {bet.side}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between text-xs">
                <div>
                  {bet.market.resolved ? (
                    <span
                      className={`font-semibold ${
                        isWin
                          ? "text-emerald-400"
                          : isLoss
                            ? "text-red-400"
                            : "text-zinc-500"
                      }`}
                    >
                      {isWin ? "Won" : isLoss ? "Lost" : "Resolved"}
                    </span>
                  ) : (
                    <span className="text-zinc-500">Active</span>
                  )}
                </div>
                <span className="text-zinc-600">
                  {new Date(bet.created_at).toLocaleDateString()}
                </span>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
