import { NextRequest, NextResponse } from "next/server";
import { addDonation, getPad } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { padId, donor, asset, amount, sig } = b || {};
    if (!padId || !donor || !asset || !amount || !sig) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const pad = await getPad(padId);
    if (!pad) return NextResponse.json({ error: "unknown pad" }, { status: 404 });
    const donation = await addDonation({
      padId,
      donor,
      asset,
      amount: Number(amount),
      sig,
    });
    return NextResponse.json({ ok: true, donation });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
