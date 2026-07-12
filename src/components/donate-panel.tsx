"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { buildDonateTx } from "@/lib/donate-tx";
import { solscanTx } from "@/lib/config";
import type { Asset } from "@/lib/types";
import { ArrowUpRight, Check, Droplets, Wallet } from "lucide-react";

const QUICK: Record<Asset, number[]> = {
  USDC: [25, 50, 100],
  SOL: [0.5, 1, 2],
};

export function DonatePanel({
  padId,
  vault,
  asset,
}: {
  padId: string;
  vault: string;
  asset: Asset;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  const [amount, setAmount] = useState<string>(String(QUICK[asset][1]));
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [sig, setSig] = useState("");
  const [err, setErr] = useState("");
  const [faucetMsg, setFaucetMsg] = useState("");
  const label = asset === "USDC" ? "dUSDC" : "SOL";

  async function donate() {
    setErr("");
    if (!publicKey) {
      setVisible(true);
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setErr("Enter an amount above zero.");
      return;
    }
    try {
      setStatus("sending");
      const tx = await buildDonateTx({
        connection,
        donor: publicKey,
        vault: new PublicKey(vault),
        asset,
        amount: amt,
        padId,
      });
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");
      await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ padId, donor: publicKey.toBase58(), asset, amount: amt, sig: signature }),
      });
      setSig(signature);
      setStatus("done");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message || "The transaction did not go through.");
      setStatus("error");
    }
  }

  async function faucet() {
    if (!publicKey) {
      setVisible(true);
      return;
    }
    setFaucetMsg("Sending test dUSDC…");
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFaucetMsg("100 dUSDC is on the way. Give it a few seconds, then donate.");
    } catch (e) {
      setFaucetMsg("Faucet is busy, try again in a moment.");
    }
  }

  if (status === "done") {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand">
          <Check size={22} />
        </div>
        <h3 className="mt-4 text-base font-semibold">Donation confirmed</h3>
        <p className="mt-1 text-sm text-muted">
          Your {amount} {label} is now held in the pad vault, waiting on proof of delivery.
        </p>
        <a href={solscanTx(sig)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand hover:underline">
          View on Solscan <ArrowUpRight size={14} />
        </a>
        <button onClick={() => setStatus("idle")} className="mt-5 block w-full chip py-2 text-sm text-fg">
          Give again
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Back this pad</h3>
        <span className="chip px-2 py-0.5 text-[11px] text-brand">{label}</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Your donation lands in the vault, not the operator&apos;s pocket.
      </p>

      <div className="mt-4 flex gap-2">
        {QUICK[asset].map((q) => (
          <button
            key={q}
            onClick={() => setAmount(String(q))}
            className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
              amount === String(q) ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:border-line-2"
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <div className="flex items-center rounded-lg border border-line bg-ink-2 px-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
          <span className="mono text-xs text-faint">{label}</span>
        </div>
      </div>

      {err && <p className="mt-3 text-sm text-danger">{err}</p>}

      <button onClick={donate} disabled={status === "sending"} className="btn-brand mt-4 flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-60">
        {!publicKey ? (
          <>
            <Wallet size={16} /> Connect wallet to give
          </>
        ) : status === "sending" ? (
          "Confirming on devnet…"
        ) : (
          `Donate ${amount || 0} ${label}`
        )}
      </button>

      {asset === "USDC" ? (
        <div className="mt-4 border-t border-line pt-4">
          <button onClick={faucet} className="flex w-full items-center justify-center gap-2 text-xs text-muted hover:text-brand">
            <Droplets size={13} /> Need test dUSDC? Get 100 free
          </button>
          {faucetMsg && <p className="mt-2 text-center text-xs text-faint">{faucetMsg}</p>}
        </div>
      ) : (
        <p className="mt-4 border-t border-line pt-4 text-center text-xs text-faint">
          Need devnet SOL?{" "}
          <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" className="text-brand hover:underline">
            Use the Solana faucet
          </a>
        </p>
      )}
    </div>
  );
}
