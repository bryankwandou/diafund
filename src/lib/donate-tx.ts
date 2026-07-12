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
import { DEVNET_USDC_MINT } from "./config";
import { memoIx, donateMemo } from "./memo";
import type { Asset } from "./types";

// Builds the donation transaction the donor wallet will sign. SOL moves natively;
// USDC moves as an SPL transfer into the pad vault's token account, creating that
// account first if it does not exist yet.
export async function buildDonateTx(params: {
  connection: Connection;
  donor: PublicKey;
  vault: PublicKey;
  asset: Asset;
  amount: number;
  padId: string;
}): Promise<Transaction> {
  const { connection, donor, vault, asset, amount, padId } = params;
  const tx = new Transaction();

  if (asset === "SOL") {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: donor,
        toPubkey: vault,
        lamports: Math.round(amount * LAMPORTS_PER_SOL),
      })
    );
  } else {
    const mint = new PublicKey(DEVNET_USDC_MINT);
    const fromAta = await getAssociatedTokenAddress(mint, donor);
    const toAta = await getAssociatedTokenAddress(mint, vault);
    const toInfo = await connection.getAccountInfo(toAta);
    if (!toInfo) {
      tx.add(createAssociatedTokenAccountInstruction(donor, toAta, vault, mint));
    }
    tx.add(
      createTransferCheckedInstruction(
        fromAta,
        mint,
        toAta,
        donor,
        Math.round(amount * 1_000_000),
        6
      )
    );
  }

  tx.add(memoIx(donateMemo(padId)));
  tx.feePayer = donor;
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  return tx;
}
