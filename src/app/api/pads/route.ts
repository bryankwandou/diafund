import { NextRequest, NextResponse } from "next/server";
import { createPad, listPads } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { screenPadCreation, saveFlags } from "@/lib/screening";

export async function GET() {
  return NextResponse.json({ pads: await listPads() });
}

// Open to every signed-in account. Guarded by:
//  - anti-bot: honeypot field + minimum form fill time
//  - velocity limits per account and per IP (enforced in screening)
//  - AML/anti-scam screening that auto-flags risky pads for review
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "sign in to open a pad" }, { status: 401 });
    }

    const b = await req.json();
    const {
      hubId, title, summary, category, location, asset, goal, beneficiary,
      milestones, visibility, website, formStartedAt,
    } = b || {};

    // Honeypot: real browsers never fill this hidden field.
    if (website) {
      return NextResponse.json({ error: "submission rejected" }, { status: 400 });
    }
    // Bots submit instantly; humans need a moment to describe a cause.
    if (!formStartedAt || Date.now() - Number(formStartedAt) < 5000) {
      return NextResponse.json(
        { error: "form submitted too fast — please take a moment and try again" },
        { status: 429 }
      );
    }

    if (!hubId || !title || !asset || !goal || !beneficiary || !Array.isArray(milestones) || milestones.length === 0) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }
    if (String(title).length < 8 || String(summary || "").length < 40) {
      return NextResponse.json(
        { error: "title must be at least 8 characters and the summary at least 40 — donors deserve context" },
        { status: 400 }
      );
    }
    if (milestones.length > 12) {
      return NextResponse.json({ error: "at most 12 milestones" }, { status: 400 });
    }

    const ms = milestones.map((m: any) => ({
      title: String(m.title || "").slice(0, 120),
      detail: String(m.detail || "").slice(0, 500),
      amount: Number(m.amount),
      deadlineDays: Number(m.deadlineDays || 21),
    }));
    if (ms.some((m) => !m.title || !(m.amount > 0) || !(m.deadlineDays > 0))) {
      return NextResponse.json(
        { error: "every milestone needs a title, a positive amount and a deadline" },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") || "unknown";

    const screening = await screenPadCreation({
      user, ip,
      title: String(title),
      summary: String(summary || ""),
      goal: Number(goal),
      asset,
      beneficiary: String(beneficiary),
      milestones: ms,
    });
    if (!screening.allowed) {
      return NextResponse.json({ error: screening.reason }, { status: 429 });
    }

    const pad = await createPad({
      hubId,
      title: String(title).slice(0, 120),
      summary: String(summary || "").slice(0, 2000),
      category: String(category || "General").slice(0, 40),
      location: String(location || "").slice(0, 80),
      asset,
      goal: Number(goal),
      beneficiary: String(beneficiary),
      milestones: ms,
      visibility: visibility === "unlisted" ? "unlisted" : "public",
      creatorId: user.id,
      creatorIp: ip,
      riskScore: screening.riskScore,
      reviewStatus: screening.reviewStatus,
    });
    await saveFlags(pad.id, screening.flags);

    return NextResponse.json({
      ok: true,
      pad,
      review: screening.reviewStatus === "flagged"
        ? "Your pad was auto-flagged for a quick review and is not public yet. It will go live once cleared."
        : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
