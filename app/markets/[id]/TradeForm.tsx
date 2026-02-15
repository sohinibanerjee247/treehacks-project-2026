"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { Input } from "@/components/ui";
import Button from "@/components/ui/Button";

type Props = {
  marketId: string;
  balance: number;
  yesPrice: number;
  noPrice: number;
  position: { yes_shares: number; no_shares: number };
};

export default function TradeForm({
  marketId,
  balance,
  yesPrice,
  noPrice,
  position,
}: Props) {
  const router = useRouter();
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentPrice = side === "YES" ? yesPrice : noPrice;
  const sharesHeld =
    side === "YES" ? position.yes_shares : position.no_shares;

  // Estimate: for buy, amount is dollars. For sell, amount is shares.
  const estimatedShares =
    action === "buy" ? (amount * 100) / (currentPrice * 100 || 1) : 0;
  const estimatedPayout =
    action === "sell" ? amount * currentPrice * 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const body =
        action === "buy"
          ? { action, side, amount: Math.round(amount * 100) } // dollars to cents
          : { action, side, amount }; // shares

      const res = await fetch(`/api/markets/${marketId}/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Trade failed");
        return;
      }

      const sharesStr = data.shares.toFixed(2);
      const costStr = (data.cost / 100).toFixed(2);
      if (action === "buy") {
        setSuccess(`Bought ${sharesStr} ${side} shares for $${costStr}`);
      } else {
        setSuccess(`Sold ${sharesStr} ${side} shares for $${costStr}`);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Balance: ${(balance / 100).toFixed(2)}
        </p>
        {(position.yes_shares > 0 || position.no_shares > 0) && (
          <p className="text-xs text-zinc-500">
            Position: {position.yes_shares.toFixed(1)} YES /{" "}
            {position.no_shares.toFixed(1)} NO
          </p>
        )}
      </div>

      {/* Action toggle */}
      <div className="mb-4 flex rounded-lg bg-zinc-800/50 p-1">
        <button
          type="button"
          onClick={() => {
            setAction("buy");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            action === "buy"
              ? "bg-zinc-700 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => {
            setAction("sell");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            action === "sell"
              ? "bg-zinc-700 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Side */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Side
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSide("YES")}
              className={`flex-1 rounded-lg border py-3 text-sm font-medium transition-colors ${
                side === "YES"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <div>YES</div>
              <div className="text-lg font-semibold">{(yesPrice * 100).toFixed(1)}%</div>
              <div className="text-xs text-zinc-500">{(yesPrice * 100).toFixed(0)}¢/share</div>
            </button>
            <button
              type="button"
              onClick={() => setSide("NO")}
              className={`flex-1 rounded-lg border py-3 text-sm font-medium transition-colors ${
                side === "NO"
                  ? "border-red-500/50 bg-red-500/10 text-red-400"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <div>NO</div>
              <div className="text-lg font-semibold">{(noPrice * 100).toFixed(1)}%</div>
              <div className="text-xs text-zinc-500">{(noPrice * 100).toFixed(0)}¢/share</div>
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            {action === "buy" ? "Amount ($)" : `Shares to sell (have ${sharesHeld.toFixed(2)})`}
          </label>
          <Input
            type="number"
            min={action === "buy" ? 1 : 0.01}
            max={action === "sell" ? sharesHeld : undefined}
            step={action === "buy" ? 1 : 0.01}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={loading}
          />
          {action === "buy" && amount > 0 && (
            <p className="mt-1 text-xs text-zinc-600">
              ≈ {estimatedShares.toFixed(2)} {side} shares
            </p>
          )}
          {action === "sell" && amount > 0 && (
            <p className="mt-1 text-xs text-zinc-600">
              ≈ ${(estimatedPayout / 100).toFixed(2)} payout
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-accent">{success}</p>}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading || (action === "sell" && sharesHeld <= 0)}
        >
          {loading
            ? "Processing..."
            : action === "buy"
              ? `Buy ${side}`
              : `Sell ${side}`}
        </Button>
      </form>
    </Card>
  );
}
