import Link from "next/link";
import { Wordmark } from "./logo";
import { solscanAddress } from "@/lib/config";
import { TREASURY_PUBKEY } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Wordmark size={24} />
          <p className="max-w-sm text-sm text-faint">
            Giving you can follow to the end. Every tranche is escrowed on Solana and
            paid out only against proof of delivery.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-muted">
          <Link href="/explore" className="hover:text-fg">Explore pads</Link>
          <Link href="/console" className="hover:text-fg">Operator console</Link>
          <a
            href={solscanAddress(TREASURY_PUBKEY)}
            target="_blank"
            rel="noreferrer"
            className="hover:text-fg"
          >
            Treasury on Solscan
          </a>
        </div>
      </div>
      <div className="border-t border-line/50 px-5 py-4 text-center text-xs text-faint">
        Built for the Solana devnet. dUSDC is a devnet test asset, not real money.
      </div>
    </footer>
  );
}
