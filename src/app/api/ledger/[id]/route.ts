import { NextRequest, NextResponse } from "next/server";
import { getPadDetail } from "@/lib/db";
import { ledgerSummary } from "@/lib/groq";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pad = await getPadDetail(id);
  if (!pad) return NextResponse.json({ error: "unknown pad" }, { status: 404 });
  try {
    const summary = await ledgerSummary(pad);
    return NextResponse.json({ summary });
  } catch (e) {
    return NextResponse.json({ summary: `${pad.title}: ${pad.raised} of ${pad.goal} ${pad.asset} raised.` });
  }
}
