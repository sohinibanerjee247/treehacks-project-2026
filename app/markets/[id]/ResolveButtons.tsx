"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import Button from "@/components/ui/Button";

type Props = { marketId: string };

export default function ResolveButtons({ marketId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResolve(outcome: "yes" | "no") {
    setError(null);
    setLoading(outcome);
    try {
      const res = await fetch(`/api/markets/${marketId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to resolve");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
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
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={() => handleResolve("yes")}
          disabled={loading !== null}
        >
          {loading === "yes" ? "Resolving…" : "Resolve Yes"}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={() => handleResolve("no")}
          disabled={loading !== null}
        >
          {loading === "no" ? "Resolving…" : "Resolve No"}
        </Button>
      </div>
    </Card>
  );
}
