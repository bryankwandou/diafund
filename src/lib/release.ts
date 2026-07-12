import "server-only";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { RPC_URL, DEVNET_USDC_MINT } from "./config";
import { treasurySigner, padVault } from "./signer";
import { memoIx, releaseMemo } from "./memo";
import type { Asset } from "./types";

export function conn() {
  return new Connection(RPC_URL, "confirmed");
}

// Executes a milestone release from the pad vault to the beneficiary. The treasury
// pays the network fee; the pad vault authorizes moving the money. The proof hash is
// written into the memo so the explorer record carries the evidence fingerprint.
export async function executeRelease(params: {
  padId: string;
  milestoneId: string;
  asset: Asset;
  amount: number;
  beneficiary: string;
  proofHash: string;
}): Promise<string> {
  const { padId, milestoneId, asset, amount, beneficiary, proofHash } = params;
  const connection = conn();
  const treasury = treasurySigner();
  const vault = padVault(padId);
  const to = new PublicKey(beneficiary);

  const tx = new Transaction();

  if (asset === "SOL") {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: vault.publicKey,
        toPubkey: to,
        lamports: Math.round(amount * LAMPORTS_PER_SOL),
      })
    );
  } else {
    const mint = new PublicKey(DEVNET_USDC_MINT);
    const fromAta = await getAssociatedTokenAddress(mint, vault.publicKey);
    const toAta = await getAssociatedTokenAddress(mint, to);
    const toInfo = await connection.getAccountInfo(toAta);
    if (!toInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(treasury.publicKey, toAta, to, mint)
      );
    }
    tx.add(
      createTransferCheckedInstruction(
        fromAta,
        mint,
        toAta,
        vault.publicKey,
        Math.round(amount * 1_000_000),
        6
      )
    );
  }

  tx.add(memoIx(releaseMemo(padId, milestoneId, proofHash)));
  tx.feePayer = treasury.publicKey;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
    "confirmed"
  );
  tx.recentBlockhash = blockhash;
  tx.sign(treasury, vault);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed"
  );
  return sig;
}

// Balance of a pad vault, for showing how much is currently held on-chain.
export async function vaultBalance(padId: string, asset: Asset): Promise<number> {
  const connection = conn();
  const vault = padVault(padId);
  if (asset === "SOL") {
    const l = await connection.getBalance(vault.publicKey);
    return l / LAMPORTS_PER_SOL;
  }
  try {
    const mint = new PublicKey(DEVNET_USDC_MINT);
    const ata = await getAssociatedTokenAddress(mint, vault.publicKey);
    const b = await connection.getTokenAccountBalance(ata);
    return b.value.uiAmount || 0;
  } catch {
    return 0;
  }
}

export function padVaultPubkey(padId: string): string {
  return padVault(padId).publicKey.toBase58();
}
