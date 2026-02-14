import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          Welcome back, {user.user_metadata?.full_name || user.email?.split("@")[0] || "there"}
        </h1>
        <p className="mt-2 text-zinc-400">
          Your balance: <span className="font-semibold text-accent">$1,000.00</span>
        </p>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: My Bets & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Active Bets */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-100">My Active Bets</h2>
              <button className="text-sm text-accent hover:text-accent-hover transition-colors">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {[
                { market: "CS 212 Midterm avg > 85%", position: "YES", shares: 50, value: "$45" },
                { market: "NU Football Beat Michigan", position: "NO", shares: 30, value: "$21" },
                { market: "Norris closed Friday", position: "YES", shares: 20, value: "$18" },
              ].map((bet, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4 hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-200">{bet.market}</h3>
                      <div className="mt-2 flex items-center gap-3 text-sm">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                            bet.position === "YES"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {bet.position}
                        </span>
                        <span className="text-zinc-500">{bet.shares} shares</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-zinc-100">{bet.value}</div>
                      <div className="text-xs text-zinc-500">Current value</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Empty state if no bets */}
            {/* <div className="rounded-lg border border-zinc-800/80 border-dashed bg-zinc-900/20 p-12 text-center">
              <p className="text-zinc-500">You haven't placed any bets yet.</p>
              <button className="mt-4 rounded-lg bg-accent px-6 py-2 text-sm font-medium text-[#0a0a0a] hover:bg-accent-hover transition-colors">
                Browse Markets
              </button>
            </div> */}
          </section>

          {/* Browse Markets */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-100">Browse Markets</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: "Snow this week", category: "Weather", prob: "72%" },
                { title: "Google at career fair", category: "Career", prob: "88%" },
                { title: "1835 Hinman full", category: "Housing", prob: "45%" },
                { title: "Dillo Day in May", category: "Social", prob: "91%" },
              ].map((market, i) => (
                <div
                  key={i}
                  className="group rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4 hover:border-accent/40 hover:bg-zinc-900/60 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-medium text-zinc-400">
                        {market.category}
                      </span>
                      <h3 className="mt-2 font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors">
                        {market.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-accent">{market.prob}</div>
                      <div className="text-xs text-zinc-500">YES</div>
                    </div>
                  </div>
                  <button className="mt-3 w-full rounded-md bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/20 transition-colors">
                    Place Bet
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column: Communities & Discussions */}
        <div className="space-y-6">
          {/* Communities */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">My Communities</h2>
            <div className="space-y-3">
              {["Academics", "Sports", "Campus Life"].map((community, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4 hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-200">{community}</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        {Math.floor(Math.random() * 50 + 10)} markets
                      </p>
                    </div>
                    <button className="text-sm text-accent hover:text-accent-hover transition-colors">
                      View
                    </button>
                  </div>
                </div>
              ))}
              <button className="w-full rounded-lg border border-zinc-700 border-dashed px-4 py-3 text-sm font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors">
                + Join New Community
              </button>
            </div>
          </section>

          {/* Live Discussions */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">Live Discussions</h2>
            <div className="space-y-3">
              {[
                { user: "Alex", text: "CS 212 midterm was tough!", time: "2m" },
                { user: "Jordan", text: "Anyone betting on the game?", time: "5m" },
                { user: "Sam", text: "Norris hours changed", time: "8m" },
              ].map((msg, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 text-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-zinc-300">{msg.user}</span>
                      <p className="mt-1 text-zinc-400">{msg.text}</p>
                    </div>
                    <span className="text-xs text-zinc-600">{msg.time}</span>
                  </div>
                </div>
              ))}
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
                <input
                  type="text"
                  placeholder="Join the discussion..."
                  className="w-full bg-transparent text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
