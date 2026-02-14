"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-white text-black hover:bg-zinc-200 focus:ring-zinc-400",
  secondary:
    "bg-transparent text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-300 focus:ring-zinc-600",
  danger:
    "bg-transparent text-red-400 border border-red-900/50 hover:bg-red-950/30 hover:border-red-800 focus:ring-red-800",
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
        "inline-flex cursor-pointer items-center justify-center rounded-md border border-transparent px-3.5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:opacity-50",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
