"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { Input } from "@/components/ui";
import Button from "@/components/ui/Button";

type Props = {
  marketId: string;
  balance?: number;
};

export default function BetForm({ marketId, balance = 1000 }: Props) {
  const router = useRouter();
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/markets/${marketId}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side,
          amount: Math.round(amount * 100), // Convert dollars to cents
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to place bet");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <p className="text-xs text-zinc-500">
        Balance: ${(balance / 100).toFixed(2)}
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Side
          </label>
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as "YES" | "NO")}
            className="w-full max-w-[10rem] rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Amount ($)
          </label>
          <Input
            type="number"
            min={1}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button
          type="submit"
          variant="primary"
          className="w-fit"
          disabled={loading}
        >
          {loading ? "Placing bet..." : "Place bet"}
        </Button>
      </form>
    </Card>
  );
}
