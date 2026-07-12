import "server-only";
import { Keypair } from "@solana/web3.js";
import { createHash } from "crypto";
import bs58 from "bs58";

// The treasury/verifier keypair. Server-only. Never import from a client component.
export function treasurySigner(): Keypair {
  const b58 = process.env.SIGNER_SECRET_B58;
  if (!b58) throw new Error("SIGNER_SECRET_B58 is not set");
  return Keypair.fromSecretKey(bs58.decode(b58));
}

// Each pad gets its own vault keypair, deterministically derived from the treasury
// secret and the pad id. The server can always rebuild it to sign a release, and no
// extra per-pad secret has to be stored anywhere.
export function padVault(padId: string): Keypair {
  const b58 = process.env.SIGNER_SECRET_B58;
  if (!b58) throw new Error("SIGNER_SECRET_B58 is not set");
  const secret = bs58.decode(b58);
  const seed = createHash("sha256")
    .update(Buffer.from(secret))
    .update("|pad|")
    .update(padId)
    .digest()
    .subarray(0, 32);
  return Keypair.fromSeed(seed);
}
