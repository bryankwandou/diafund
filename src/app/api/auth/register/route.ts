import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sql } from "@/lib/sql";
import { hashPassword, setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const username = String(b.username || "").trim();
    const email = String(b.email || "").trim();
    const password = String(b.password || "");
    const confirm = String(b.confirm || "");
    const tos = Boolean(b.tos);
    const privacy = Boolean(b.privacy);

    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username))
      return NextResponse.json({ error: "Username must be 3–24 letters, numbers, or underscores." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    if (password !== confirm)
      return NextResponse.json({ error: "The two passwords do not match." }, { status: 400 });
    if (!tos || !privacy)
      return NextResponse.json({ error: "You need to accept the terms and the privacy agreement." }, { status: 400 });

    const clash = await sql`select id from users where lower(username)=lower(${username}) or lower(email)=lower(${email}) limit 1`;
    if (clash.length) return NextResponse.json({ error: "That username or email is already taken." }, { status: 409 });

    const id = "u-" + randomUUID().slice(0, 12);
    await sql`insert into users (id, username, email, password_hash, role, tos_accepted, privacy_accepted)
      values (${id}, ${username}, ${email}, ${hashPassword(password)}, 'user', ${tos}, ${privacy})`;
    await setSession(id);
    return NextResponse.json({ ok: true, user: { id, username, email, role: "user" } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
