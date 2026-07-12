import { NextRequest, NextResponse } from "next/server";
import { getMilestone, getPad, markReleased } from "@/lib/db";
import { executeRelease } from "@/lib/release";

// Releases a milestone's tranche to the beneficiary. Only runs when the milestone has
// a recorded proof. Returns the real devnet transaction signature.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { milestoneId } = b || {};
    if (!milestoneId) return NextResponse.json({ error: "missing milestoneId" }, { status: 400 });

    const ms = await getMilestone(milestoneId);
    if (!ms) return NextResponse.json({ error: "unknown milestone" }, { status: 404 });
    if (ms.status !== "proven" || !ms.proofHash) {
      return NextResponse.json({ error: "milestone has no verified proof yet" }, { status: 409 });
    }
    const pad = await getPad(ms.padId);
    if (!pad) return NextResponse.json({ error: "unknown pad" }, { status: 404 });

    const sig = await executeRelease({
      padId: pad.id,
      milestoneId: ms.id,
      asset: pad.asset,
      amount: ms.amount,
      beneficiary: pad.beneficiary,
      proofHash: ms.proofHash,
    });
    await markReleased(ms.id, sig);
    return NextResponse.json({ ok: true, sig });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
