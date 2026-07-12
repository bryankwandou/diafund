import { NextRequest, NextResponse } from "next/server";
import { createHub, listHubs } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ hubs: await listHubs() });
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { name, steward, blurb } = b || {};
    if (!name || !steward) {
      return NextResponse.json({ error: "name and steward are required" }, { status: 400 });
    }
    const hub = await createHub({ name, steward, blurb: blurb || "" });
    return NextResponse.json({ ok: true, hub });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
