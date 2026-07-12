import "server-only";
import { sql } from "./sql";
import { padVaultPubkey } from "./release";
import { TREASURY_PUBKEY } from "./config";
import { hashPassword } from "./auth";

const BENEFICIARY = "5JTDJdfDHqu3TEHuBTATJF49G8i8YKy42riJG9KWFfSk";
const days = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

export async function initDb() {
  await sql`create table if not exists users (
    id text primary key,
    username text unique not null,
    email text unique not null,
    password_hash text not null,
    role text not null default 'user',
    total_donated numeric not null default 0,
    pads_backed int not null default 0,
    proofs_signed int not null default 0,
    tos_accepted boolean not null default false,
    privacy_accepted boolean not null default false,
    created_at timestamptz not null default now()
  )`;

  await sql`create table if not exists hubs (
    id text primary key,
    name text not null,
    steward text not null,
    blurb text,
    created_at timestamptz not null default now()
  )`;

  await sql`create table if not exists pads (
    id text primary key,
    hub_id text not null references hubs(id),
    title text not null,
    summary text,
    category text,
    location text,
    vault text not null,
    asset text not null,
    goal numeric not null,
    raised numeric not null default 0,
    beneficiary text not null,
    status text not null default 'open',
    created_at timestamptz not null default now()
  )`;

  await sql`create table if not exists milestones (
    id text primary key,
    pad_id text not null references pads(id),
    idx int not null,
    title text not null,
    detail text,
    amount numeric not null,
    status text not null default 'locked',
    deadline timestamptz,
    proof_hash text,
    attestation_id text,
    release_sig text
  )`;

  await sql`create table if not exists donations (
    id text primary key,
    pad_id text not null,
    donor text not null,
    asset text not null,
    amount numeric not null,
    sig text not null,
    user_id text,
    created_at timestamptz not null default now()
  )`;

  await sql`create table if not exists attestations (
    id text primary key,
    milestone_id text not null,
    verifier text not null,
    proof_hash text not null,
    note text,
    created_at timestamptz not null default now()
  )`;

  await seedContent();
  await seedAdmin();
}

async function seedContent() {
  const existing = await sql`select count(*)::int as n from hubs`;
  if (existing[0].n > 0) return;

  await sql`insert into hubs (id, name, steward, blurb) values
    ('cahaya-timur', 'Yayasan Cahaya Timur', ${TREASURY_PUBKEY},
     'A field foundation working across eastern Indonesia on water, schooling, and disaster relief.'),
    ('relawan-nusantara', 'Relawan Nusantara', ${TREASURY_PUBKEY},
     'A volunteer network that runs short, tightly scoped relief projects and reports back on each one.')
    on conflict (id) do nothing`;

  const pads = [
    { id: "air-desa-wolo", hub: "cahaya-timur", title: "Clean water for Desa Wolo",
      summary: "Drill and equip a shared well so 240 households stop walking two hours for drinking water.",
      category: "Water", location: "Wolo, Southeast Sulawesi", asset: "USDC", goal: 5000 },
    { id: "beasiswa-makassar", hub: "cahaya-timur", title: "One term of school for 20 students",
      summary: "Cover fees, books, and transport for twenty students in Makassar for a full term.",
      category: "Education", location: "Makassar, South Sulawesi", asset: "USDC", goal: 3000 },
    { id: "dapur-banjir", hub: "relawan-nusantara", title: "Community kitchen after the flood",
      summary: "Run a warm-meal kitchen for displaced families for three weeks while homes are cleared.",
      category: "Relief", location: "Demak, Central Java", asset: "SOL", goal: 20 },
  ];

  for (const p of pads) {
    await sql`insert into pads (id, hub_id, title, summary, category, location, vault, asset, goal, beneficiary, status)
      values (${p.id}, ${p.hub}, ${p.title}, ${p.summary}, ${p.category}, ${p.location},
              ${padVaultPubkey(p.id)}, ${p.asset}, ${p.goal}, ${BENEFICIARY}, 'open')
      on conflict (id) do nothing`;
  }

  const ms: Array<[string, number, string, string, number, number]> = [
    ["air-desa-wolo", 0, "Site survey and permits", "Confirm the water table and secure village and district permits.", 800, 10],
    ["air-desa-wolo", 1, "Drilling and casing", "Drill the borehole and install casing to a safe depth.", 2200, 25],
    ["air-desa-wolo", 2, "Pump, tank, and taps", "Install the pump, storage tank, and four public tap stands.", 1500, 40],
    ["air-desa-wolo", 3, "Handover and training", "Hand the well to the village committee and train two caretakers.", 500, 55],
    ["beasiswa-makassar", 0, "Enrollment and fees", "Pay term fees for the twenty selected students.", 1600, 14],
    ["beasiswa-makassar", 1, "Books and supplies", "Buy books, uniforms, and supplies against itemized receipts.", 900, 28],
    ["beasiswa-makassar", 2, "Transport stipend", "Disburse a monthly transport stipend for the term.", 500, 45],
    ["dapur-banjir", 0, "Week one meals", "Serve roughly 1,400 meals in the first week.", 8, 7],
    ["dapur-banjir", 1, "Week two meals", "Continue meals and add clean water sachets.", 7, 14],
    ["dapur-banjir", 2, "Week three and closeout", "Final week of meals and a short public report.", 5, 21],
  ];
  for (const [padId, idx, title, detail, amount, dl] of ms) {
    await sql`insert into milestones (id, pad_id, idx, title, detail, amount, status, deadline)
      values (${`${padId}-m${idx}`}, ${padId}, ${idx}, ${title}, ${detail}, ${amount}, 'locked', ${days(dl)})
      on conflict (id) do nothing`;
  }
}

async function seedAdmin() {
  const rows = await sql`select id from users where lower(username) = lower('nayrbryanGaming') limit 1`;
  if (rows.length) return;
  await sql`insert into users
    (id, username, email, password_hash, role, total_donated, pads_backed, proofs_signed, tos_accepted, privacy_accepted)
    values ('u-admin', 'nayrbryanGaming', 'nayrbryangaming3@gmail.com', ${hashPassword("@Nataliamaria12345")},
            'admin', 12450, 9, 14, true, true)
    on conflict (id) do nothing`;
}
