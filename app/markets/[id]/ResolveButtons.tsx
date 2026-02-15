"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import Button from "@/components/ui/Button";

type Props = { marketId: string; marketTitle: string };

export default function ResolveButtons({ marketId, marketTitle }: Props) {
  const router = useRouter();
  const [selectedOutcome, setSelectedOutcome] = useState<"yes" | "no">("yes");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitResolve() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/markets/${marketId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: selectedOutcome }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to resolve");
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <p className="text-xs text-zinc-500">
        Resolve this market when the outcome is known. (Admin only.)
      </p>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
      <div className="mt-3 flex items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Resolve
          </label>
          <select
            value={selectedOutcome}
            onChange={(e) =>
              setSelectedOutcome(e.target.value as "yes" | "no")
            }
            className="w-36 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            disabled={loading}
          >
            <option value="yes">YES</option>
            <option value="no">NO</option>
          </select>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
        >
          {loading ? "Submitting…" : "Submit"}
        </Button>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="text-sm font-semibold text-zinc-100">Confirm Resolution</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Are you sure the answer to
              <span className="font-medium text-zinc-200"> "{marketTitle}" </span>
              is
              <span className="font-semibold text-zinc-100"> {selectedOutcome.toUpperCase()}</span>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={submitResolve}
                disabled={loading}
              >
                {loading ? "Submitting…" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
