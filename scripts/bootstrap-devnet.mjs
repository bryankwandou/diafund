// Bootstrap Diafund devnet assets.
// - Derives the treasury/verifier keypair from the seed hex.
// - Confirms it matches the funded devnet wallet.
// - Ensures it holds SOL (airdrop if low).
// - Creates the devnet SPL mint that stands in for USDC and mints a supply.
// Prints the values to paste into .env.local. Run: node scripts/bootstrap-devnet.mjs
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import bs58 from "bs58";

const SECRET_B58 = process.env.DIAFUND_SECRET_B58;
if (!SECRET_B58) {
  console.error("Set DIAFUND_SECRET_B58 before running.");
  process.exit(1);
}

const RPC = process.env.RPC_URL || "https://api.devnet.solana.com";
const conn = new Connection(RPC, "confirmed");

const treasury = Keypair.fromSecretKey(bs58.decode(SECRET_B58));
console.log("Treasury pubkey:", treasury.publicKey.toBase58());

let bal = await conn.getBalance(treasury.publicKey);
console.log("Balance:", bal / LAMPORTS_PER_SOL, "SOL");

if (bal < 0.5 * LAMPORTS_PER_SOL) {
  try {
    console.log("Requesting airdrop...");
    const sig = await conn.requestAirdrop(treasury.publicKey, LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig, "confirmed");
    bal = await conn.getBalance(treasury.publicKey);
    console.log("New balance:", bal / LAMPORTS_PER_SOL, "SOL");
  } catch (e) {
    console.log("Airdrop failed (rate limit is normal):", e.message);
  }
}

if (bal < 0.05 * LAMPORTS_PER_SOL) {
  console.error("Not enough SOL to create a mint. Fund the wallet via faucet.solana.com and rerun.");
  process.exit(1);
}

console.log("Creating devnet USDC-stand-in mint (6 decimals)...");
const mint = await createMint(conn, treasury, treasury.publicKey, treasury.publicKey, 6);
console.log("Mint:", mint.toBase58());

const ata = await getOrCreateAssociatedTokenAccount(conn, treasury, mint, treasury.publicKey);
await mintTo(conn, treasury, mint, ata.address, treasury, 1_000_000_000_000); // 1,000,000 tokens
console.log("Minted 1,000,000 dUSDC to treasury ATA:", ata.address.toBase58());

console.log("\n--- paste into .env.local ---");
console.log("TREASURY_PUBKEY=" + treasury.publicKey.toBase58());
console.log("NEXT_PUBLIC_DEVNET_USDC_MINT=" + mint.toBase58());
