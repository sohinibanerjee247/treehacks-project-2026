"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { Input } from "@/components/ui";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";

type Channel = { id: string; name: string };

type Props = { channels: Channel[] };

export default function CreateMarketForm({ channels }: Props) {
  const router = useRouter();
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [resolutionSource, setResolutionSource] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [expectedResolutionTime, setExpectedResolutionTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function toLocalDatetime(iso: string) {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      return d.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiError(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error ?? "AI generation failed");
        return;
      }
      // Fill in the form with AI-generated data
      setTitle(data.title || "");
      setDescription(data.description || "");
      setRules(data.rules || "");
      setResolutionSource(data.resolutionSource || "");
      setCloseTime(toLocalDatetime(data.closeTime));
      setExpectedResolutionTime(toLocalDatetime(data.expectedResolutionTime));
    } catch (err: any) {
      setAiError(err.message ?? "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          title: title.trim(),
          description: description.trim(),
          rules: rules.trim(),
          resolutionSource: resolutionSource.trim(),
          closeTime,
          expectedResolutionTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create market");
        return;
      }
      router.push(ROUTES.CHANNEL(channelId));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      {/* AI Generation Section */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">&#x2728;</span>
          <h2 className="text-sm font-semibold text-zinc-200">AI Market Generator</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-3">
          Describe a question in plain English and let AI generate a complete market.
        </p>
        <div className="flex gap-2">
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder='e.g. "will it snow in Evanston this week?"'
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
            disabled={aiLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAiGenerate();
              }
            }}
          />
          <Button
            type="button"
            variant="primary"
            onClick={handleAiGenerate}
            disabled={aiLoading || !aiPrompt.trim()}
          >
            {aiLoading ? "Generating..." : "Generate"}
          </Button>
        </div>
        {aiError && <p className="mt-2 text-sm text-red-400">{aiError}</p>}
      </Card>

      <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Channel
          </label>
          <select
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Question (title)
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Will it snow on campus tomorrow?"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Resolves YES if..."
            rows={3}
            required
            className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Rules
          </label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="YES if instructor or TA publishes average > 82.00. Otherwise NO."
            rows={3}
            required
            className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Resolution source
          </label>
          <Input
            value={resolutionSource}
            onChange={(e) => setResolutionSource(e.target.value)}
            placeholder="Instructor post on Canvas, official class announcement, etc."
            required
            disabled={loading}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Close time
            </label>
            <Input
              type="datetime-local"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Expected resolution time
            </label>
            <Input
              type="datetime-local"
              value={expectedResolutionTime}
              onChange={(e) => setExpectedResolutionTime(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Creating…" : "Create market"}
        </Button>
      </form>
      </Card>
    </div>
  );
}
