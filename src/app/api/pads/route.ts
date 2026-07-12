import { NextRequest, NextResponse } from "next/server";
import { createPad, listPads } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ pads: await listPads() });
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { hubId, title, summary, category, location, asset, goal, beneficiary, milestones } = b || {};
    if (!hubId || !title || !asset || !goal || !beneficiary || !Array.isArray(milestones) || milestones.length === 0) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }
    const pad = await createPad({
      hubId,
      title,
      summary: summary || "",
      category: category || "General",
      location: location || "",
      asset,
      goal: Number(goal),
      beneficiary,
      milestones: milestones.map((m: any) => ({
        title: String(m.title),
        detail: String(m.detail || ""),
        amount: Number(m.amount),
        deadlineDays: Number(m.deadlineDays || 21),
      })),
    });
    return NextResponse.json({ ok: true, pad });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
