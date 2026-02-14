import Link from "next/link";
import { Card } from "@/components/ui";
import BetForm from "./BetForm";
import ResolveButtons from "./ResolveButtons";

const MOCK_MARKET = {
  id: "m-1",
  title: "Will it snow on campus tomorrow?",
  description:
    "Resolves YES if there is measurable snow on the main quad by 6pm.",
  status: "open" as const,
  yesOdds: 65,
  noOdds: 35,
  myYesCents: 0,
  myNoCents: 0,
  isAdmin: false,
};

type Props = { params: { id: string } };

export default function MarketPage({ params }: Props) {
  const m = MOCK_MARKET;

  return (
    <div>
      <p className="mb-6">
        <Link
          href="/channels/ch-1"
          className="text-sm text-zinc-500 hover:text-zinc-400"
        >
          ← Back to channel
        </Link>
      </p>

      <Card className="mb-6">
        <h1 className="text-[17px] font-medium text-zinc-100 leading-snug">
          {m.title}
        </h1>
        {m.description && (
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
            {m.description}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-zinc-800/80 bg-zinc-900/20 py-4 text-center">
            <p className="text-[11px] uppercase tracking-wider text-zinc-600">
              Yes
            </p>
            <p className="mt-1 text-xl font-medium tabular-nums text-zinc-200">
              {m.yesOdds}¢
            </p>
          </div>
          <div className="rounded-md border border-zinc-800/80 bg-zinc-900/20 py-4 text-center">
            <p className="text-[11px] uppercase tracking-wider text-zinc-600">
              No
            </p>
            <p className="mt-1 text-xl font-medium tabular-nums text-zinc-200">
              {m.noOdds}¢
            </p>
          </div>
        </div>
        {(m.myYesCents > 0 || m.myNoCents > 0) && (
          <p className="mt-3 text-xs text-zinc-600">
            Your position: Yes ${(m.myYesCents / 100).toFixed(2)} · No $
            {(m.myNoCents / 100).toFixed(2)}
          </p>
        )}
      </Card>

      {m.status === "open" && <BetForm />}

      {m.isAdmin && m.status === "open" && (
        <div className="mt-6">
          <ResolveButtons />
        </div>
      )}

      {m.status !== "open" && (
        <p className="text-sm text-zinc-600">
          Resolved {m.status === "resolved_yes" ? "Yes" : "No"}.
        </p>
      )}
    </div>
  );
}
