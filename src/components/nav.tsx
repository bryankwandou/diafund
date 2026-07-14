import Link from "next/link";
import { Wordmark } from "./logo";
import { ConnectButton } from "./connect-button";
import { AccountMenu } from "./account-menu";
import { currentUser } from "@/lib/auth";

export async function Nav() {
  const user = await currentUser();
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link href="/explore" className="hover:text-fg transition-colors">Explore</Link>
          <Link href="/create" className="hover:text-fg transition-colors">Start a pad</Link>
          <Link href="/#how" className="hover:text-fg transition-colors">How it works</Link>
          <Link href="/deck" className="hover:text-fg transition-colors">Deck</Link>
          {user?.role === "admin" && (
            <Link href="/console" className="hover:text-fg transition-colors">Console</Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <span className="chip hidden px-2.5 py-1 text-[11px] text-faint sm:inline mono">
            Solana devnet
          </span>
          <ConnectButton />
          {user ? (
            <AccountMenu username={user.username} role={user.role} />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden text-sm text-muted hover:text-fg sm:inline">
                Sign in
              </Link>
              <Link href="/register" className="chip px-3 py-1.5 text-sm text-fg hover:border-brand/50">
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
