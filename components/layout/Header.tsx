import Link from "next/link";

type Props = {
  title?: string;
  user?: { name: string; balanceCents?: number } | null;
};

export default function Header({
  title = "Micro Prediction Market",
  user,
}: Props) {
  return (
    <header className="border-b border-zinc-800/80 pb-5">
      <h1 className="text-lg font-medium tracking-tight">
        <Link href="/" className="no-underline hover:underline underline-offset-4">
          {title}
        </Link>
      </h1>
      {user && (
        <p className="mt-1.5 text-sm text-zinc-500">
          {user.name}
          {user.balanceCents != null &&
            ` · $${(user.balanceCents / 100).toFixed(2)}`}
        </p>
      )}
    </header>
  );
}
