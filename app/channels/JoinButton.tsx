"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";

type Props = {
  channelId: string;
  joined: boolean;
};

export default function JoinButton({ channelId, joined: initialJoined }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [joined, setJoined] = useState(initialJoined);
  const [loading, setLoading] = useState(false);

  const busy = loading || isPending;

  async function handleToggle() {
    setLoading(true);
    try {
      const endpoint = joined
        ? `/api/channels/${channelId}/leave`
        : `/api/channels/${channelId}/join`;

      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        // Optimistically flip the state
        setJoined(!joined);
        // Then refresh server data in the background
        startTransition(() => {
          router.refresh();
        });
      } else {
        const data = await res.json();
        console.error("Channel action failed:", data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={joined ? "ghost" : "secondary"}
      onClick={handleToggle}
      disabled={busy}
    >
      {busy
        ? joined ? "Leaving..." : "Joining..."
        : joined ? "Leave" : "Join"}
    </Button>
  );
}
