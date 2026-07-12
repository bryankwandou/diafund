// End-to-end devnet proof: donate -> anchor proof -> release, in dUSDC, writing the
// same records the app writes so the live site reflects it. Prints Solscan links.
//   DATABASE_URL=... SIGNER_SECRET_B58=... node scripts/proof-devnet.mjs
import {
  Connection, Keypair, PublicKey, Transaction, TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction, createTransferCheckedInstruction,
} from "@solana/spl-token";
import { neon } from "@neondatabase/serverless";
import { createHash, randomUUID } from "crypto";
import bs58 from "bs58";

const sql = neon(process.env.DATABASE_URL);
const SECRET = bs58.decode(process.env.SIGNER_SECRET_B58);
const treasury = Keypair.fromSecretKey(SECRET);
const MINT = new PublicKey("75ENcpvcrtpXbzpJgjibHBW55hxPTKbABnstNuXyzJqL");
const MEMO = new PublicKey("Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo");
const conn = new Connection("https://api.devnet.solana.com", "confirmed");

const PAD = "air-desa-wolo";
const MS = "air-desa-wolo-m0";
const AMOUNT = 800;
const cluster = "?cluster=devnet";

function padVault(padId) {
  const seed = createHash("sha256").update(Buffer.from(SECRET)).update("|pad|").update(padId).digest().subarray(0, 32);
  return Keypair.fromSeed(seed);
}
const memoIx = (t) => new TransactionInstruction({ keys: [], programId: MEMO, data: Buffer.from(t, "utf8") });
const link = (s) => `https://solscan.io/tx/${s}${cluster}`;

const vault = padVault(PAD);
const beneRow = await sql`select beneficiary from pads where id = ${PAD}`;
const beneficiary = new PublicKey(beneRow[0].beneficiary);
console.log("Pad vault:", vault.publicKey.toBase58());

// 1) DONATE: treasury -> vault ATA
const treasuryAta = await getOrCreateAssociatedTokenAccount(conn, treasury, MINT, treasury.publicKey);
const vaultAta = await getOrCreateAssociatedTokenAccount(conn, treasury, MINT, vault.publicKey);
{
  const tx = new Transaction().add(
    createTransferCheckedInstruction(treasuryAta.address, MINT, vaultAta.address, treasury.publicKey, AMOUNT * 1e6, 6),
    memoIx(`diafund:donate:${PAD}`)
  );
  const sig = await conn.sendTransaction(tx, [treasury]);
  await conn.confirmTransaction(sig, "confirmed");
  console.log("1. Donation:", link(sig));
  await sql`insert into donations (id, pad_id, donor, asset, amount, sig, created_at)
    values (${randomUUID()}, ${PAD}, ${treasury.publicKey.toBase58()}, 'USDC', ${AMOUNT}, ${sig}, now())`;
  await sql`update pads set raised = raised + ${AMOUNT} where id = ${PAD}`;
}

// 2) ANCHOR PROOF
const proofText = "Water-table survey WOLO-2026, district permit #0714, receipts attached.";
const proofHash = createHash("sha256").update(proofText).digest("hex");
await sql`insert into attestations (id, milestone_id, verifier, proof_hash, note)
  values (${randomUUID()}, ${MS}, ${treasury.publicKey.toBase58()}, ${proofHash}, 'Survey verified on site.')`;
await sql`update milestones set status='proven', proof_hash=${proofHash} where id=${MS} and status='locked'`;
console.log("2. Proof anchored, sha256:", proofHash.slice(0, 24) + "…");

// 3) RELEASE: vault -> beneficiary ATA, treasury pays fee, vault authorizes
{
  const beneAta = await getAssociatedTokenAddress(MINT, beneficiary);
  const tx = new Transaction();
  if (!(await conn.getAccountInfo(beneAta)))
    tx.add(createAssociatedTokenAccountInstruction(treasury.publicKey, beneAta, beneficiary, MINT));
  tx.add(
    createTransferCheckedInstruction(vaultAta.address, MINT, beneAta, vault.publicKey, AMOUNT * 1e6, 6),
    memoIx(`diafund:release:${PAD}:${MS}:${proofHash}`)
  );
  tx.feePayer = treasury.publicKey;
  const { blockhash } = await conn.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.sign(treasury, vault);
  const sig = await conn.sendRawTransaction(tx.serialize());
  await conn.confirmTransaction(sig, "confirmed");
  console.log("3. Release:", link(sig));
  await sql`update milestones set status='released', release_sig=${sig} where id=${MS}`;
  await sql`update pads set status='delivering' where id=${PAD}`;
}
console.log("\nProof complete. Open the pad page to see the released milestone with its tx link.");
