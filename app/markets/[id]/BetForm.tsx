"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { Input } from "@/components/ui";
import Button from "@/components/ui/Button";

type Props = {
  marketId: string;
  balance: number;
  yesPercent: number;
  noPercent: number;
};

export default function BetForm({
  marketId,
  balance,
  yesPercent,
  noPercent,
}: Props) {
  const router = useRouter();
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/markets/${marketId}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Bet failed");
        return;
      }

      setSuccess(data.message);
      // Refresh server components to show updated sentiment + chart
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-4">
        <p className="text-xs text-zinc-500">
          Balance: ${(balance / 100).toFixed(2)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Side Selection */}
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">
            Pick a side
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSide("YES")}
              className={`flex-1 rounded-lg border py-4 text-center font-medium transition-colors ${
                side === "YES"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <div className="text-xs uppercase tracking-wider">YES</div>
              <div className="mt-1 text-2xl font-semibold">{yesPercent.toFixed(0)}%</div>
            </button>
            <button
              type="button"
              onClick={() => setSide("NO")}
              className={`flex-1 rounded-lg border py-4 text-center font-medium transition-colors ${
                side === "NO"
                  ? "border-red-500/50 bg-red-500/10 text-red-300"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <div className="text-xs uppercase tracking-wider">NO</div>
              <div className="mt-1 text-2xl font-semibold">{noPercent.toFixed(0)}%</div>
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Amount ($)
          </label>
          <Input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={loading}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
            <p className="text-sm text-emerald-300">{success}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Placing bet..." : `Bet $${amount} on ${side}`}
        </Button>

        <p className="text-xs text-zinc-600 leading-relaxed">
          If someone is on the other side, your bet executes immediately. Otherwise it waits for a counterparty. Your balance is only deducted when matched.
        </p>
      </form>
    </Card>
  );
}
