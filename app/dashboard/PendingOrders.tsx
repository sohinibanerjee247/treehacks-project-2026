"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { Card } from "@/components/ui";

type Order = {
  id: string;
  side: string;
  amount: number;
  filled_amount: number;
  created_at: string;
  market: {
    id: string;
    title: string;
    channel?: { name: string };
  };
};

type Props = { orders: Order[] };

export default function PendingOrders({ orders }: Props) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function handleCancel(orderId: string) {
    setCancelling(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setCancelling(null);
    }
  }

  if (!orders || orders.length === 0) return null;

  return (
    <ul className="space-y-2">
      {orders.map((order) => {
        const remaining = order.amount - order.filled_amount;

        return (
          <li key={order.id}>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={ROUTES.MARKET(order.market.id)}
                    className="block text-sm font-medium text-zinc-200 hover:text-white line-clamp-1"
                  >
                    {order.market.title}
                  </Link>
                  {order.market.channel && (
                    <p className="mt-0.5 text-xs text-zinc-600">
                      {order.market.channel.name}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-semibold text-zinc-100">
                    ${(remaining / 100).toFixed(2)}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      order.side === "YES" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {order.side}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-400">
                  Waiting for counterparty
                </span>
                <button
                  onClick={() => handleCancel(order.id)}
                  disabled={cancelling === order.id}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  {cancelling === order.id ? "..." : "Cancel"}
                </button>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
