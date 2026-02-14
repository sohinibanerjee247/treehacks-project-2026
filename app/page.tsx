import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <p className="text-zinc-500 text-[15px] leading-relaxed">
        Bet on outcomes with play money. $1000 to start.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-white px-3.5 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/channels"
          className="rounded-md border border-zinc-700 px-3.5 py-2 text-sm font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
        >
          Channels
        </Link>
      </div>
    </div>
  );
}
