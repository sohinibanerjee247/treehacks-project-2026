import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div>
      <p className="mt-1 text-zinc-500 text-[15px]">
        Enter your name. You&apos;ll get $1000 in play money.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-400">
          ← Back
        </Link>
      </p>
    </div>
  );
}
