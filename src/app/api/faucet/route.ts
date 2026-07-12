import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { treasurySigner } from "@/lib/signer";
import { conn } from "@/lib/release";
import { DEVNET_USDC_MINT } from "@/lib/config";

// Hands out test dUSDC so anyone can try a donation on devnet. The treasury is the
// mint authority, so this simply mints a small amount to the caller's wallet.
export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) return NextResponse.json({ error: "missing address" }, { status: 400 });
    const c = conn();
    const treasury = treasurySigner();
    const mint = new PublicKey(DEVNET_USDC_MINT);
    const owner = new PublicKey(address);
    const ata = await getOrCreateAssociatedTokenAccount(c, treasury, mint, owner);
    const sig = await mintTo(c, treasury, mint, ata.address, treasury, 100_000_000); // 100 dUSDC
    return NextResponse.json({ ok: true, sig, amount: 100 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
