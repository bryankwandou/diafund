// End-to-end proof for the Diafund escrow program on devnet:
// init_pad -> donate -> attest -> release, printing Solscan links.
//   SIGNER_SECRET_B58=... node proof-anchor.mjs
import anchorPkg from "@coral-xyz/anchor";
const { AnchorProvider, Program, Wallet, BN } = anchorPkg;
import { Connection, Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import bs58 from "bs58";

const conn = new Connection("https://api.devnet.solana.com", "confirmed");
const payer = Keypair.fromSecretKey(bs58.decode(process.env.SIGNER_SECRET_B58));
const provider = new AnchorProvider(conn, new Wallet(payer), { commitment: "confirmed" });
const idl = JSON.parse(readFileSync("./target/idl/diafund_escrow.json", "utf8"));
const program = new Program(idl, provider);
const link = (s) => `https://solscan.io/tx/${s}?cluster=devnet`;

const padId = "demo-" + Date.now().toString(36);
const [padPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("pad"), Buffer.from(padId)],
  program.programId
);
const beneficiary = new PublicKey("5JTDJdfDHqu3TEHuBTATJF49G8i8YKy42riJG9KWFfSk");

console.log("Program:", program.programId.toBase58());
console.log("Pad PDA:", padPda.toBase58(), "id:", padId);

// 1) init_pad — payer is authority and verifier
let sig = await program.methods
  .initPad(padId)
  .accounts({
    pad: padPda,
    authority: payer.publicKey,
    verifier: payer.publicKey,
    beneficiary,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
console.log("1. init_pad:", link(sig));

// 2) donate 0.1 SOL
sig = await program.methods
  .donate(new BN(0.1 * LAMPORTS_PER_SOL))
  .accounts({ pad: padPda, donor: payer.publicKey, systemProgram: SystemProgram.programId })
  .rpc();
console.log("2. donate 0.1 SOL:", link(sig));

// 3) attest milestone 0 with a real proof hash
const proofHash = createHash("sha256")
  .update("Demo delivery receipt, verified on site.")
  .digest();
const [msPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("ms"), padPda.toBuffer(), Buffer.from([0])],
  program.programId
);
sig = await program.methods
  .attest(0, [...proofHash])
  .accounts({
    pad: padPda,
    milestone: msPda,
    verifier: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
console.log("3. attest (proof anchored):", link(sig));

// 4) release 0.05 SOL to the beneficiary — only possible because the attest above
//    created the milestone account; the program enforces beneficiary and once-only.
sig = await program.methods
  .release(0, new BN(0.05 * LAMPORTS_PER_SOL))
  .accounts({ pad: padPda, milestone: msPda, beneficiary, signer: payer.publicKey })
  .rpc();
console.log("4. release 0.05 SOL:", link(sig));

const pad = await program.account.pad.fetch(padPda);
console.log("\nPad state — raised:", pad.raised.toString(), "released:", pad.released.toString());
console.log("Escrow rules enforced by the program, not a server.");
