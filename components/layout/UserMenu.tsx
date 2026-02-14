"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants";
import type { User } from "@supabase/supabase-js";

type Props = {
  user: User;
  balance?: number;
};

export default function UserMenu({ user, balance = 1000 }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(ROUTES.HOME);
    router.refresh();
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-lg border border-zinc-700 px-3 py-2 hover:border-zinc-600 transition-colors"
      >
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={displayName}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-[#0a0a0a]">
            {initials}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-zinc-200">{displayName}</div>
          <div className="text-xs text-zinc-500">${balance.toFixed(2)}</div>
        </div>
        <svg
          className={`h-4 w-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl z-50">
          <div className="border-b border-zinc-800 px-4 py-3">
            <div className="text-sm font-medium text-zinc-200">{displayName}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{user.email}</div>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
                router.push(ROUTES.DASHBOARD);
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setOpen(false);
                // Navigate to settings when created
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              Settings
            </button>
            <button
              onClick={() => {
                setOpen(false);
                router.push(ROUTES.CHANNELS);
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              Communities
            </button>
          </div>
          <div className="border-t border-zinc-800 py-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-zinc-800/50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
