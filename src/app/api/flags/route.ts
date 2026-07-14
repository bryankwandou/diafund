import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listOpenFlags } from "@/lib/screening";
import { sql } from "@/lib/sql";

// Admin-only: review queue for auto-flagged pads.
export async function GET() {
  const user = await currentUser();
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "admin only" }, { status: 403 });
  }
  return NextResponse.json({ flags: await listOpenFlags() });
}

// Admin-only: clear a pad (approve) or block it.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "admin only" }, { status: 403 });
  }
  const { padId, action } = await req.json();
  if (!padId || !["approve", "block"].includes(action)) {
    return NextResponse.json({ error: "padId and action (approve|block) required" }, { status: 400 });
  }
  await sql`update pads set review_status = ${action === "approve" ? "approved" : "blocked"} where id = ${padId}`;
  await sql`update flags set resolved = true where pad_id = ${padId}`;
  return NextResponse.json({ ok: true });
}
