"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = { marketId: string };

export default function MarketLive({ marketId }: Props) {
  const router = useRouter();
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setLastEvent(msg);
    setVisible(true);
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);
    // Auto-dismiss after 3 seconds
    timerRef.current = setTimeout(() => setVisible(false), 3000);
    router.refresh();
  }, [router]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`market-${marketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bets", filter: `market_id=eq.${marketId}` },
        () => showToast("New bet placed")
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `market_id=eq.${marketId}` },
        () => showToast("Order updated")
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `market_id=eq.${marketId}` },
        () => showToast("New order")
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "markets", filter: `id=eq.${marketId}` },
        () => showToast("Market updated")
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "market_comments", filter: `market_id=eq.${marketId}` },
        () => showToast("New comment")
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [marketId, showToast]);

  if (!visible || !lastEvent) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="rounded-lg border border-accent/30 bg-zinc-900/95 px-4 py-2 text-xs text-accent shadow-lg backdrop-blur-sm">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live — {lastEvent}
      </div>
    </div>
  );
}
