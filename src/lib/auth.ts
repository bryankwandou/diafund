import "server-only";
import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHmac,
} from "crypto";
import { cookies } from "next/headers";
import { sql, num } from "./sql";

const COOKIE = "diafund_session";
const SECRET = process.env.SESSION_SECRET || "diafund_dev_secret";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  totalDonated: number;
  padsBacked: number;
  proofsSigned: number;
  createdAt: string;
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const h = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${h}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, h] = stored.split(":");
  if (!salt || !h) return false;
  const hh = scryptSync(pw, salt, 64);
  const hb = Buffer.from(h, "hex");
  return hb.length === hh.length && timingSafeEqual(hb, hh);
}

function sign(id: string): string {
  const sig = createHmac("sha256", SECRET).update(id).digest("hex");
  return `${id}.${sig}`;
}

function unsign(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const id = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expect = createHmac("sha256", SECRET).update(id).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expect, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

export async function setSession(userId: string) {
  const c = await cookies();
  c.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE);
}

function rowToUser(r: Record<string, unknown>): User {
  return {
    id: String(r.id),
    username: String(r.username),
    email: String(r.email),
    role: (r.role as "admin" | "user") || "user",
    totalDonated: num(r.total_donated),
    padsBacked: num(r.pads_backed),
    proofsSigned: num(r.proofs_signed),
    createdAt: String(r.created_at),
  };
}

export async function currentUser(): Promise<User | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  const id = unsign(token);
  if (!id) return null;
  const rows = await sql`select * from users where id = ${id} limit 1`;
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function findByLogin(login: string) {
  const rows = await sql`
    select * from users
    where lower(username) = lower(${login}) or lower(email) = lower(${login})
    limit 1`;
  return rows[0] || null;
}

export { rowToUser };
