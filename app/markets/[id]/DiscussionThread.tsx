"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";
import Button from "@/components/ui/Button";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string | null;
};

type Props = {
  marketId: string;
  comments: Comment[];
  currentUserId: string;
};

export default function DiscussionThread({
  marketId,
  comments: initialComments,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to new comments via Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments-${marketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "market_comments",
          filter: `market_id=eq.${marketId}`,
        },
        () => {
          // Refresh server data to get full comment with profile info
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId, router]);

  // Keep comments in sync with server re-renders
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Auto-scroll when comments change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/markets/${marketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        setNewComment("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <Card className="mt-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-300">
        Discussion
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-zinc-600 mb-4">
          No comments yet — be the first to share your take.
        </p>
      ) : (
        <div className="mb-4 max-h-80 space-y-3 overflow-y-auto pr-1">
          {comments.map((c) => {
            const isOwn = c.user_id === currentUserId;
            const displayName =
              c.username || (isOwn ? "You" : "Anonymous");

            return (
              <div
                key={c.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  isOwn
                    ? "ml-8 bg-accent/10 border border-accent/20"
                    : "mr-8 bg-zinc-800/60 border border-zinc-700/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-zinc-300 text-xs">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {timeAgo(c.created_at)}
                  </span>
                </div>
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {c.content}
                </p>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts..."
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          disabled={loading}
        />
        <Button type="submit" variant="primary" disabled={loading || !newComment.trim()}>
          {loading ? "..." : "Send"}
        </Button>
      </form>
    </Card>
  );
}
