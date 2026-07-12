import "server-only";
import { randomUUID } from "crypto";
import { sql, num } from "./sql";
import { padVaultPubkey } from "./release";
import type {
  Asset,
  Attestation,
  Donation,
  Hub,
  Milestone,
  Pad,
  PadDetail,
} from "./types";

const now = () => new Date().toISOString();
const days = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

// ---- row mappers ----
const toHub = (r: any): Hub => ({
  id: r.id, name: r.name, steward: r.steward, blurb: r.blurb || "", createdAt: String(r.created_at),
});
const toPad = (r: any): Pad => ({
  id: r.id, hubId: r.hub_id, title: r.title, summary: r.summary || "",
  category: r.category || "General", location: r.location || "", vault: r.vault,
  asset: r.asset as Asset, goal: num(r.goal), raised: num(r.raised),
  beneficiary: r.beneficiary, status: r.status, createdAt: String(r.created_at),
});
const toMilestone = (r: any): Milestone => ({
  id: r.id, padId: r.pad_id, idx: num(r.idx), title: r.title, detail: r.detail || "",
  amount: num(r.amount), status: r.status, deadline: String(r.deadline),
  proofHash: r.proof_hash || undefined, attestationId: r.attestation_id || undefined,
  releaseSig: r.release_sig || undefined,
});
const toDonation = (r: any): Donation => ({
  id: r.id, padId: r.pad_id, donor: r.donor, asset: r.asset as Asset,
  amount: num(r.amount), sig: r.sig, createdAt: String(r.created_at),
});
const toAttestation = (r: any): Attestation => ({
  id: r.id, milestoneId: r.milestone_id, verifier: r.verifier,
  proofHash: r.proof_hash, note: r.note || "", createdAt: String(r.created_at),
});

// ---- reads ----
export async function listHubs(): Promise<Hub[]> {
  const rows = await sql`select * from hubs order by created_at`;
  return rows.map(toHub);
}
export async function getHub(id: string): Promise<Hub | undefined> {
  const rows = await sql`select * from hubs where id = ${id} limit 1`;
  return rows[0] ? toHub(rows[0]) : undefined;
}
export async function listPads(): Promise<Pad[]> {
  const rows = await sql`select * from pads order by created_at`;
  return rows.map(toPad);
}
export async function getPad(id: string): Promise<Pad | undefined> {
  const rows = await sql`select * from pads where id = ${id} limit 1`;
  return rows[0] ? toPad(rows[0]) : undefined;
}
export async function getMilestone(id: string): Promise<Milestone | undefined> {
  const rows = await sql`select * from milestones where id = ${id} limit 1`;
  return rows[0] ? toMilestone(rows[0]) : undefined;
}
export async function getPadDetail(id: string): Promise<PadDetail | undefined> {
  const pad = await getPad(id);
  if (!pad) return undefined;
  const hub = await getHub(pad.hubId);
  const [ms, dn, at] = await Promise.all([
    sql`select * from milestones where pad_id = ${id} order by idx`,
    sql`select * from donations where pad_id = ${id} order by created_at desc`,
    sql`select a.* from attestations a join milestones m on m.id = a.milestone_id where m.pad_id = ${id}`,
  ]);
  return {
    ...pad,
    hub: hub!,
    milestones: ms.map(toMilestone),
    donations: dn.map(toDonation),
    attestations: at.map(toAttestation),
  };
}
export async function recentDonations(limit = 8): Promise<Donation[]> {
  const rows = await sql`select * from donations order by created_at desc limit ${limit}`;
  return rows.map(toDonation);
}
export async function stats() {
  const [h, p, d, mAll, mRel] = await Promise.all([
    sql`select count(*)::int n from hubs`,
    sql`select count(*)::int n from pads`,
    sql`select count(*)::int n from donations`,
    sql`select count(*)::int n from milestones`,
    sql`select count(*)::int n from milestones where status = 'released'`,
  ]);
  return {
    hubs: h[0].n, pads: p[0].n, donations: d[0].n,
    milestonesTotal: mAll[0].n, milestonesReleased: mRel[0].n,
  };
}

// ---- writes ----
function slug(s: string): string {
  return (
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) ||
    randomUUID().slice(0, 8)
  );
}

export async function createHub(input: { name: string; steward: string; blurb: string }): Promise<Hub> {
  const id = slug(input.name);
  const rows = await sql`
    insert into hubs (id, name, steward, blurb)
    values (${id}, ${input.name}, ${input.steward}, ${input.blurb})
    returning *`;
  return toHub(rows[0]);
}

export async function createPad(input: {
  hubId: string; title: string; summary: string; category: string; location: string;
  asset: Asset; goal: number; beneficiary: string;
  milestones: Array<{ title: string; detail: string; amount: number; deadlineDays: number }>;
}): Promise<Pad> {
  const id = slug(input.title);
  const rows = await sql`
    insert into pads (id, hub_id, title, summary, category, location, vault, asset, goal, beneficiary, status)
    values (${id}, ${input.hubId}, ${input.title}, ${input.summary}, ${input.category}, ${input.location},
            ${padVaultPubkey(id)}, ${input.asset}, ${input.goal}, ${input.beneficiary}, 'open')
    returning *`;
  let i = 0;
  for (const m of input.milestones) {
    await sql`
      insert into milestones (id, pad_id, idx, title, detail, amount, status, deadline)
      values (${`${id}-m${i}`}, ${id}, ${i}, ${m.title}, ${m.detail}, ${m.amount}, 'locked', ${days(m.deadlineDays)})`;
    i++;
  }
  return toPad(rows[0]);
}

export async function addDonation(input: {
  padId: string; donor: string; asset: Asset; amount: number; sig: string; userId?: string;
}): Promise<Donation> {
  const id = randomUUID();
  const rows = await sql`
    insert into donations (id, pad_id, donor, asset, amount, sig, user_id, created_at)
    values (${id}, ${input.padId}, ${input.donor}, ${input.asset}, ${input.amount}, ${input.sig}, ${input.userId || null}, ${now()})
    returning *`;
  await sql`update pads set raised = raised + ${input.amount},
             status = case when raised + ${input.amount} >= goal then 'funded' else status end
           where id = ${input.padId}`;
  if (input.userId) {
    await sql`update users set total_donated = total_donated + ${input.amount},
               pads_backed = pads_backed + 1 where id = ${input.userId}`;
  }
  return toDonation(rows[0]);
}

export async function addAttestation(input: {
  milestoneId: string; verifier: string; proofHash: string; note: string; userId?: string;
}): Promise<Attestation> {
  const id = randomUUID();
  const rows = await sql`
    insert into attestations (id, milestone_id, verifier, proof_hash, note)
    values (${id}, ${input.milestoneId}, ${input.verifier}, ${input.proofHash}, ${input.note})
    returning *`;
  await sql`update milestones set status = 'proven', proof_hash = ${input.proofHash}, attestation_id = ${id}
           where id = ${input.milestoneId} and status = 'locked'`;
  if (input.userId) {
    await sql`update users set proofs_signed = proofs_signed + 1 where id = ${input.userId}`;
  }
  return toAttestation(rows[0]);
}

export async function markReleased(milestoneId: string, sig: string) {
  await sql`update milestones set status = 'released', release_sig = ${sig} where id = ${milestoneId}`;
  const rows = await sql`select pad_id from milestones where id = ${milestoneId} limit 1`;
  const padId = rows[0]?.pad_id;
  if (!padId) return;
  const rem = await sql`select count(*)::int n from milestones where pad_id = ${padId} and status <> 'released'`;
  await sql`update pads set status = ${rem[0].n === 0 ? "closed" : "delivering"} where id = ${padId}`;
}
