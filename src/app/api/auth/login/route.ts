import { NextRequest, NextResponse } from "next/server";
import { findByLogin, verifyPassword, setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const login = String(b.login || b.username || "").trim();
    const password = String(b.password || "");
    if (!login || !password)
      return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });

    const row = await findByLogin(login);
    if (!row || !verifyPassword(password, String(row.password_hash)))
      return NextResponse.json({ error: "Those credentials do not match an account." }, { status: 401 });

    await setSession(String(row.id));
    return NextResponse.json({
      ok: true,
      user: { id: row.id, username: row.username, role: row.role },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
