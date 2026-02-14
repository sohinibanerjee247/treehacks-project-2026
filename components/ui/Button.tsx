"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-[#0a0a0a] hover:bg-accent-hover focus:ring-accent/40",
  secondary:
    "bg-transparent text-zinc-300 border border-zinc-600 hover:border-zinc-500 hover:text-zinc-100 focus:ring-zinc-500",
  ghost:
    "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5 focus:ring-zinc-500",
  danger:
    "bg-transparent text-red-400/90 border border-red-900/50 hover:bg-red-950/20 hover:border-red-800 focus:ring-red-500",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export default function Button({
  variant = "primary",
  type = "button",
  className,
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
