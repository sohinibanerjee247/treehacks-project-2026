"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { Card } from "@/components/ui";

type Position = {
  market_id: string;
  yes_shares: number;
  no_shares: number;
  market: {
    id: string;
    title: string;
    resolved: boolean;
    outcome: string | null;
    yes_pool: number;
    no_pool: number;
    channel: {
      name: string;
    };
  };
};

type Props = {
  positions: Position[];
};

export default function PositionsList({ positions }: Props) {
  if (!positions || positions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-zinc-500">No active positions.</p>
        <Link href={ROUTES.CHANNELS} className="mt-2 inline-block text-sm text-accent hover:text-accent-hover">
          Browse markets
        </Link>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {positions.map((pos) => {
        const yp = pos.market.yes_pool ?? 10000;
        const np = pos.market.no_pool ?? 10000;
        const total = yp + np;
        const yesPrice = np / total;
        const noPrice = yp / total;

        const yesValue = pos.yes_shares * yesPrice * 100;
        const noValue = pos.no_shares * noPrice * 100;
        const totalValue = yesValue + noValue;

        const isWin = pos.market.resolved && pos.market.outcome === "YES" && pos.yes_shares > 0;
        const isLoss = pos.market.resolved && pos.market.outcome !== null && totalValue > 0 && !isWin;

        return (
          <li key={pos.market_id}>
            <Card className="p-3">
              <Link
                href={ROUTES.MARKET(pos.market_id)}
                className="block text-sm font-medium text-zinc-200 hover:text-white"
              >
                {pos.market.title}
              </Link>
              <p className="mt-1 text-xs text-zinc-500">
                {pos.market.channel.name}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {pos.yes_shares > 0 && (
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-400">
                    {pos.yes_shares.toFixed(1)} YES
                  </span>
                )}
                {pos.no_shares > 0 && (
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-medium text-red-400">
                    {pos.no_shares.toFixed(1)} NO
                  </span>
                )}

                {!pos.market.resolved && (
                  <span className="ml-auto text-zinc-500">
                    ≈ ${(totalValue / 100).toFixed(2)}
                  </span>
                )}

                {pos.market.resolved && (
                  <span
                    className={`ml-auto font-semibold ${
                      isWin
                        ? "text-emerald-400"
                        : isLoss
                          ? "text-red-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {isWin ? "Won" : isLoss ? "Lost" : "—"}
                  </span>
                )}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
