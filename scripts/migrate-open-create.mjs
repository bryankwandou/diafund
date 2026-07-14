// One-time migration: open pad creation to all users.
// Adds creator/visibility/review columns to pads and a flags table for the
// auto-flag screening engine. Safe to re-run (IF NOT EXISTS everywhere).
//   node scripts/migrate-open-create.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envLine = (k) =>
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(k + "="))
    ?.slice(k.length + 1)
    .trim();

const sql = neon(process.env.DATABASE_URL || envLine("DATABASE_URL"));

await sql`alter table pads add column if not exists visibility text not null default 'public'`;
await sql`alter table pads add column if not exists creator_id text`;
await sql`alter table pads add column if not exists creator_ip text`;
await sql`alter table pads add column if not exists risk_score int not null default 0`;
await sql`alter table pads add column if not exists review_status text not null default 'approved'`;

await sql`create table if not exists flags (
  id text primary key,
  pad_id text not null references pads(id),
  rule text not null,
  detail text not null default '',
  severity int not null default 1,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
)`;
await sql`create index if not exists flags_pad_idx on flags(pad_id)`;
await sql`create index if not exists pads_review_idx on pads(review_status, visibility)`;

console.log("open-create migration applied");
