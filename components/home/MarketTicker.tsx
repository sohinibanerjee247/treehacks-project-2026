"use client";

import { useEffect, useState } from "react";

const markets = [
  { symbol: "CS 212", question: "Midterm avg > 85%", category: "Academics" },
  { symbol: "EECS 311", question: "Final on Tuesday", category: "Academics" },
  { symbol: "NU Football", question: "Beat Michigan", category: "Sports" },
  { symbol: "Dining", question: "Norris closed Friday", category: "Campus" },
  { symbol: "Weather", question: "Snow this week", category: "Life" },
  { symbol: "Tech", question: "Google at career fair", category: "Career" },
  { symbol: "Housing", question: "1835 Hinman full", category: "Campus" },
  { symbol: "Events", question: "Dillo Day in May", category: "Social" },
];

function randomPrice() {
  return Math.floor(Math.random() * 100);
}

function randomChange() {
  return (Math.random() * 20 - 10).toFixed(1);
}

export default function MarketTicker() {
  const [mounted, setMounted] = useState(false);
  const [tickers, setTickers] = useState(
    markets.map((m) => ({
      ...m,
      price: 50,
      change: "0.0",
    }))
  );

  useEffect(() => {
    setMounted(true);
    
    // Initial random values
    setTickers(
      markets.map((m) => ({
        ...m,
        price: randomPrice(),
        change: randomChange(),
      }))
    );

    const interval = setInterval(() => {
      setTickers((prev) =>
        prev.map((t) => ({
          ...t,
          price: randomPrice(),
          change: randomChange(),
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/40 to-zinc-900/20 p-6 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-400">
          Northwestern Community Markets
        </h3>
        <p className="text-xs text-zinc-600 mt-1">
          Live prediction probabilities
        </p>
      </div>
      <div className="flex h-full flex-col justify-start gap-2.5">
        {tickers.map((ticker, i) => (
          <div
            key={ticker.symbol}
            className="group relative overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-900/60 px-4 py-3 transition-all duration-300 hover:border-accent/40 hover:bg-zinc-900/80"
            style={{
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-medium text-zinc-400">
                    {ticker.category}
                  </span>
                </div>
                <div className="mt-1.5 text-sm font-medium text-zinc-200 line-clamp-1">
                  {ticker.question}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">{ticker.symbol}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div 
                  className="font-mono text-lg font-semibold text-zinc-100 transition-all duration-300"
                  suppressHydrationWarning
                >
                  {mounted ? `${ticker.price}%` : "50%"}
                </div>
                <div
                  className={`text-xs font-medium transition-all duration-300 ${
                    mounted && parseFloat(ticker.change) >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                  suppressHydrationWarning
                >
                  {mounted ? (
                    <>
                      {parseFloat(ticker.change) >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(ticker.change))}%
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
