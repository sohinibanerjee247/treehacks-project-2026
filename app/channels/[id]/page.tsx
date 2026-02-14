import Link from "next/link";
import { Card } from "@/components/ui";

const MOCK_MARKETS = [
  {
    id: "m-1",
    title: "Will it snow on campus tomorrow?",
    status: "open",
    yesOdds: 65,
    noOdds: 35,
  },
  {
    id: "m-2",
    title: "Will the football team win Saturday?",
    status: "open",
    yesOdds: 48,
    noOdds: 52,
  },
  {
    id: "m-3",
    title: "Pizza at the dorm by 8pm?",
    status: "resolved_yes",
    yesOdds: 80,
    noOdds: 20,
  },
];

type Props = { params: { id: string } };

export default function ChannelPage({ params }: Props) {
  const { id } = params;
  const channelName =
    id === "ch-1" ? "Campus Life" : id === "ch-2" ? "Sports" : "CS 101";

  return (
    <div>
      <p className="mb-6">
        <Link
          href="/channels"
          className="text-sm text-zinc-500 hover:text-zinc-400"
        >
          ← Channels
        </Link>
      </p>
      <p className="text-zinc-500 text-[15px]">
        Markets in this channel.
      </p>
      <ul className="mt-8 space-y-2">
        {MOCK_MARKETS.map((m) => (
          <li key={m.id}>
            <Card className="p-4">
              <Link
                href={`/markets/${m.id}`}
                className="block font-medium text-zinc-200 hover:text-white"
              >
                {m.title}
              </Link>
              <p className="mt-1.5 text-xs text-zinc-600">
                Yes {m.yesOdds}¢ · No {m.noOdds}¢
                {m.status !== "open" && (
                  <span className="ml-1.5">
                    · {m.status === "resolved_yes" ? "Resolved Yes" : "Resolved No"}
                  </span>
                )}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
