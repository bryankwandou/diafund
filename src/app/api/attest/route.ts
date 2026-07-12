import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { addAttestation, getMilestone } from "@/lib/db";
import { TREASURY_PUBKEY } from "@/lib/config";

// Records a proof of delivery for a milestone. The proof text (a receipt reference,
// a note, a link) is hashed here; the hash is what gets anchored on-chain at release.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { milestoneId, note, proofText, verifier } = b || {};
    if (!milestoneId || !proofText) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const ms = await getMilestone(milestoneId);
    if (!ms) return NextResponse.json({ error: "unknown milestone" }, { status: 404 });
    if (ms.status !== "locked") {
      return NextResponse.json({ error: "milestone already has a proof" }, { status: 409 });
    }
    const proofHash = createHash("sha256").update(String(proofText)).digest("hex");
    const att = await addAttestation({
      milestoneId,
      verifier: verifier || TREASURY_PUBKEY,
      proofHash,
      note: note || "",
    });
    return NextResponse.json({ ok: true, attestation: att, proofHash });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
