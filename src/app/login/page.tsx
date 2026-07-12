"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign in failed.");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="aurora" />
      <div className="card relative w-full max-w-md p-7">
        <Link href="/">
          <Wordmark />
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to pick up where you left off.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-faint">Username or email</label>
            <input className="df-input" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-faint">Password</label>
            <input className="df-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {err && <p className="text-sm text-danger">{err}</p>}
          <button type="submit" disabled={busy} className="btn-brand w-full py-2.5 text-sm disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          New here? <Link href="/register" className="text-brand hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
