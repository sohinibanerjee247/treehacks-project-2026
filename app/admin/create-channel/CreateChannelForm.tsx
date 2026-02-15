"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { Input } from "@/components/ui";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";

export default function CreateChannelForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create channel");
        return;
      }
      router.push(ROUTES.CHANNELS);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Channel name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Campus Life"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What kind of markets will be in this channel?"
            rows={3}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
            disabled={loading}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Creating…" : "Create channel"}
        </Button>
      </form>
    </Card>
  );
}
