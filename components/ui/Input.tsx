"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "w-full max-w-[12rem] rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600",
        className
      )}
      {...props}
    />
  );
}
