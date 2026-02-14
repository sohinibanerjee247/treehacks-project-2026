"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";

type Mode = "login" | "signup";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      setError(err === "auth" ? "Authentication failed. Please try again." : err);
    }
  }, [searchParams]);

  function clearFeedback() {
    setError(null);
    setMessage(null);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearFeedback();
    setLoading(true);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${ROUTES.AUTH_CALLBACK}`,
        },
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data?.user && !data?.session) {
        setMessage(
          "Account created. Check your email and click the confirmation link to sign in."
        );
        setPassword("");
        return;
      }

      if (data?.session) {
        window.location.href = ROUTES.DASHBOARD;
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (signInError) {
        setError(signInError.message);
        return;
      }

      window.location.href = ROUTES.DASHBOARD;
    }
  }

  async function handleGoogleSignIn() {
    clearFeedback();
    setLoading(true);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${ROUTES.AUTH_CALLBACK}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
      return;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Log in / Sign up toggle */}
      <div className="flex rounded-lg bg-zinc-800/50 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            clearFeedback();
          }}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
            mode === "login"
              ? "bg-zinc-700 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            clearFeedback();
          }}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
            mode === "signup"
              ? "bg-zinc-700 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={mode === "signup"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            disabled={loading}
            minLength={mode === "signup" ? 6 : undefined}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-accent" role="status">
            {message}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full py-3"
        >
          {loading
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-zinc-900/30 px-3 text-zinc-500">or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        disabled={loading}
        onClick={handleGoogleSignIn}
        className="w-full py-3"
      >
        Google
      </Button>
    </div>
  );
}
