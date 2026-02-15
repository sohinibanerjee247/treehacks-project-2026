"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  message: string;
};

export default function SuccessBanner({ message }: Props) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  function dismiss() {
    setVisible(false);
    // Clear the URL parameter
    router.replace("/dashboard", { scroll: false });
  }

  if (!visible) return null;

  return (
    <div className="mb-6 rounded-lg border border-accent/30 bg-accent/10 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 text-accent flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm font-medium text-accent">{message}</p>
      </div>
      <button
        onClick={dismiss}
        className="text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Dismiss"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
