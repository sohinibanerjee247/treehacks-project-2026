import Link from "next/link";
import { Card } from "@/components/ui";
import Button from "@/components/ui/Button";

const MOCK_CHANNELS = [
  { id: "ch-1", name: "Campus Life", memberCount: 42, joined: false },
  { id: "ch-2", name: "Sports", memberCount: 28, joined: true },
  { id: "ch-3", name: "CS 101", memberCount: 15, joined: false },
];

export default function ChannelsPage() {
  return (
    <div>
      <p className="mb-6">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-400">
          ← Home
        </Link>
      </p>
      <p className="text-zinc-500 text-[15px]">
        Join a channel to see and bet on its markets.
      </p>
      <ul className="mt-8 space-y-2">
        {MOCK_CHANNELS.map((ch) => (
          <li key={ch.id}>
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/channels/${ch.id}`}
                    className="font-medium text-zinc-200 hover:text-white"
                  >
                    {ch.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    {ch.memberCount} members
                  </p>
                </div>
                {ch.joined ? (
                  <span className="text-xs text-zinc-500">Joined</span>
                ) : (
                  <Button variant="secondary">Join</Button>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
