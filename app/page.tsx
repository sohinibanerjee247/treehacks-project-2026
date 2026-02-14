import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import MarketTicker from "@/components/home/MarketTicker";

export default function HomePage() {
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      {/* Left: Animated ticker */}
      <div className="order-2 lg:order-1">
        <MarketTicker />
      </div>

      {/* Right: Hero content */}
      <div className="order-1 flex flex-col justify-center lg:order-2">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-100 sm:text-6xl lg:text-7xl">
          Bet anytime.
          <br />
          anywhere.
        </h1>
        <p className="mt-6 text-lg text-zinc-400 leading-relaxed">
          Predict Northwestern outcomes with play money. Start with $1,000.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-8 py-4 text-base font-semibold text-[#0a0a0a] shadow-lg shadow-accent/20 hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/30 transition-all duration-200"
          >
            Get Started
          </Link>
          <Link
            href={ROUTES.CHANNELS}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-8 py-4 text-base font-medium text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900/50 transition-all duration-200"
          >
            Browse Markets
          </Link>
        </div>
      </div>
    </div>
  );
}
