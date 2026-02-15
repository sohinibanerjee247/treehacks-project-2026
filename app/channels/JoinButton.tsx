"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";

type Props = { channelId: string };

export default function JoinButton({ channelId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/join`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleJoin} disabled={loading}>
      {loading ? "Joining..." : "Join"}
    </Button>
  );
}
