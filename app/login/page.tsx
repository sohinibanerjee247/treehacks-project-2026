import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8 shadow-xl shadow-black/20">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Welcome back
        </h2>
        <p className="mt-2 text-[15px] text-zinc-500 leading-relaxed">
          Sign in or create an account. You&apos;ll get $1000 in play money to
          start.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
      <p className="mt-8 text-center">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
