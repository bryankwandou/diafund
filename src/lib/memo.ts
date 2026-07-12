import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { MEMO_PROGRAM_ID } from "./config";

// A memo instruction that tags a transaction so the on-chain record is self-describing.
export function memoIx(text: string) {
  return new TransactionInstruction({
    keys: [],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from(text, "utf8"),
  });
}

export const donateMemo = (padId: string) => `diafund:donate:${padId}`;
export const releaseMemo = (padId: string, milestoneId: string, proofHash: string) =>
  `diafund:release:${padId}:${milestoneId}:${proofHash}`;
