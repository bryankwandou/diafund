import "server-only";
import { neon } from "@neondatabase/serverless";

// Single Neon HTTP client for the whole app. Every part of Diafund that needs to
// persist state — accounts, hubs, pads, milestones, donations, proofs — goes
// through here.
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(process.env.DATABASE_URL);

// numeric columns come back from the HTTP driver as strings; normalize them.
export const num = (v: unknown): number => (v == null ? 0 : Number(v));
