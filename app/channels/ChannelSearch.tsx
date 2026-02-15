"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import JoinButton from "./JoinButton";

type Channel = {
  id: string;
  name: string;
  description: string | null;
  joined: boolean;
  memberCount: number;
};

type Props = {
  channels: Channel[];
  showJoin: boolean;
  showSignIn: boolean;
};

export default function ChannelSearch({ channels, showJoin, showSignIn }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? channels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(query.toLowerCase()) ||
          ch.description?.toLowerCase().includes(query.toLowerCase())
      )
    : channels;

  return (
    <div>
      {/* Search input */}
      <div className="relative mt-6">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search communities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900/40 py-3 pl-10 pr-4 text-zinc-100 placeholder-zinc-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
        />
      </div>

      {/* Results */}
      <ul className="mt-6 space-y-3">
        {filtered.map((ch) => (
          <li key={ch.id}>
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={ROUTES.CHANNEL(ch.id)}
                    className="font-medium text-zinc-200 hover:text-white"
                  >
                    {ch.name}
                  </Link>
                  {ch.description && (
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {ch.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-zinc-600">
                    {ch.memberCount} {ch.memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
                {showJoin && (
                  <JoinButton channelId={ch.id} joined={ch.joined} />
                )}
                {showSignIn && (
                  <Link href={ROUTES.LOGIN}>
                    <span className="text-sm text-accent hover:text-accent-hover transition-colors">
                      Sign in to join
                    </span>
                  </Link>
                )}
              </div>
            </Card>
          </li>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-zinc-500">
              {query.trim()
                ? `No communities matching "${query}"`
                : "No communities yet."}
            </p>
          </Card>
        )}
      </ul>
    </div>
  );
}
