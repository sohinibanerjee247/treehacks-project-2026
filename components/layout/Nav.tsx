import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function Nav() {
  return (
    <nav className="mt-4 flex items-center gap-6 text-sm text-zinc-500">
      <Link href={ROUTES.HOME}>Home</Link>
      <Link href={ROUTES.LOGIN}>Log in</Link>
      <Link href={ROUTES.CHANNELS}>Channels</Link>
    </nav>
  );
}
