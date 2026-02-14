"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-zinc-700/80 bg-zinc-900/40 px-4 py-3 text-zinc-100 placeholder-zinc-500",
        "focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20",
        "transition-colors duration-150",
        className
      )}
      {...props}
    />
  );
}
