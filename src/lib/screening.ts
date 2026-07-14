import "server-only";
import { randomUUID } from "crypto";
import { sql, num } from "./sql";
import type { User } from "./auth";

// Lightweight AML / anti-scam screening for open pad creation.
// Modeled on US-style compliance controls (BSA/FinCEN thinking) without KYC:
// value thresholds, velocity limits, keyword screening, duplicate detection
// and account-age heuristics. Every hit is recorded as a flag; enough weight
// puts the pad in "flagged" review status, which hides it from Explore and
// disables donations until an admin clears it.

export interface ScreeningInput {
  user: User;
  ip: string;
  title: string;
  summary: string;
  goal: number;
  asset: "SOL" | "USDC";
  beneficiary: string;
  milestones: Array<{ amount: number; deadlineDays: number }>;
}

export interface Flag {
  rule: string;
  detail: string;
  severity: number; // 1 low, 2 medium, 3 high
}

export interface ScreeningResult {
  allowed: boolean; // hard-reject when false
  reason?: string; // shown to the user on rejection
  flags: Flag[];
  riskScore: number;
  reviewStatus: "approved" | "flagged";
}

// Structuring / too-good-to-be-true phrasing common in donation scams.
const SCAM_TERMS = [
  "guaranteed return",
  "guaranteed profit",
  "double your",
  "triple your",
  "risk free",
  "risk-free",
  "airdrop",
  "giveaway",
  "send back",
  "investment opportunity",
  "matched funds",
  "get rich",
  "urgent wire",
  "western union",
  "gift card",
];

// Large-value threshold: big asks get a human look before going live.
const HIGH_VALUE = { SOL: 500, USDC: 10_000 };
// Velocity limits (anti-bot / anti-spam):
const MAX_PADS_PER_USER_24H = 2;
const MAX_PADS_PER_IP_24H = 3;
// Flags totalling this much severity => held for review instead of live.
const FLAG_THRESHOLD = 3;

export async function screenPadCreation(
  input: ScreeningInput
): Promise<ScreeningResult> {
  const flags: Flag[] = [];
  const text = `${input.title} ${input.summary}`.toLowerCase();

  // --- hard limits (reject outright) ---
  const [byUser, byIp] = await Promise.all([
    sql`select count(*)::int n from pads where creator_id = ${input.user.id}
        and created_at > now() - interval '24 hours'`,
    sql`select count(*)::int n from pads where creator_ip = ${input.ip}
        and created_at > now() - interval '24 hours'`,
  ]);
  if (num(byUser[0]?.n) >= MAX_PADS_PER_USER_24H) {
    return reject("You can open at most 2 pads per day. Try again tomorrow.");
  }
  if (num(byIp[0]?.n) >= MAX_PADS_PER_IP_24H) {
    return reject("Too many pads created from this network today. Try again tomorrow.");
  }
  const total = input.milestones.reduce((s, m) => s + m.amount, 0);
  if (Math.abs(total - input.goal) > input.goal * 0.01) {
    return reject("Milestone amounts must add up to the pad goal.");
  }

  // --- soft signals (auto-flag) ---
  const hit = SCAM_TERMS.find((t) => text.includes(t));
  if (hit) {
    flags.push({
      rule: "scam-language",
      detail: `title/summary contains "${hit}"`,
      severity: 3,
    });
  }

  if (input.goal >= HIGH_VALUE[input.asset]) {
    flags.push({
      rule: "high-value",
      detail: `goal ${input.goal} ${input.asset} is above the ${HIGH_VALUE[input.asset]} ${input.asset} review threshold`,
      severity: 2,
    });
  }

  const accountAgeH =
    (Date.now() - new Date(input.user.createdAt).getTime()) / 3_600_000;
  if (accountAgeH < 24) {
    flags.push({
      rule: "new-account",
      detail: `creator account is ${accountAgeH.toFixed(1)}h old`,
      severity: accountAgeH < 1 ? 2 : 1,
    });
  }

  const [dupTitle, dupBenef] = await Promise.all([
    sql`select id from pads where lower(title) = lower(${input.title}) limit 1`,
    sql`select id from pads where beneficiary = ${input.beneficiary}
        and review_status = 'flagged' limit 1`,
  ]);
  if (dupTitle[0]) {
    flags.push({
      rule: "duplicate-title",
      detail: `identical title to existing pad ${dupTitle[0].id}`,
      severity: 2,
    });
  }
  if (dupBenef[0]) {
    flags.push({
      rule: "linked-to-flagged",
      detail: `beneficiary wallet already used by flagged pad ${dupBenef[0].id}`,
      severity: 3,
    });
  }

  if (input.milestones.some((m) => m.deadlineDays < 3)) {
    flags.push({
      rule: "rushed-deadline",
      detail: "a milestone deadline is under 3 days — common in pressure scams",
      severity: 1,
    });
  }

  const riskScore = flags.reduce((s, f) => s + f.severity, 0);
  return {
    allowed: true,
    flags,
    riskScore,
    reviewStatus: riskScore >= FLAG_THRESHOLD ? "flagged" : "approved",
  };

  function reject(reason: string): ScreeningResult {
    return { allowed: false, reason, flags: [], riskScore: 0, reviewStatus: "approved" };
  }
}

export async function saveFlags(padId: string, flags: Flag[]) {
  for (const f of flags) {
    await sql`insert into flags (id, pad_id, rule, detail, severity)
      values (${randomUUID()}, ${padId}, ${f.rule}, ${f.detail}, ${f.severity})`;
  }
}

export async function listOpenFlags() {
  return sql`select f.*, p.title from flags f join pads p on p.id = f.pad_id
    where f.resolved = false order by f.created_at desc limit 100`;
}
