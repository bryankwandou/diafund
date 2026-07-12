"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { shortAddr } from "@/lib/utils";

export function ConnectButton() {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (publicKey) {
    return (
      <button
        onClick={() => disconnect()}
        className="chip px-3 py-1.5 text-sm mono hover:border-brand/60 transition-colors"
        title="Click to disconnect"
      >
        {shortAddr(publicKey.toBase58())}
      </button>
    );
  }
  return (
    <button
      onClick={() => setVisible(true)}
      className="btn-brand px-4 py-1.5 text-sm"
    >
      {connecting ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
