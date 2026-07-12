"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/logo";
import { Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [f, setF] = useState({ username: "", email: "", password: "", confirm: "" });
  const [tos, setTos] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, tos, privacy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
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
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted">
          Back milestones, follow the proof, and keep your giving history in one place.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Username">
            <input className="df-input" value={f.username} onChange={set("username")} placeholder="yourname" autoComplete="username" />
          </Field>
          <Field label="Email">
            <input className="df-input" type="email" value={f.email} onChange={set("email")} placeholder="you@email.com" autoComplete="email" />
          </Field>
          <Field label="Password">
            <input className="df-input" type="password" value={f.password} onChange={set("password")} placeholder="At least 8 characters" autoComplete="new-password" />
          </Field>
          <Field label="Confirm password">
            <input className="df-input" type="password" value={f.confirm} onChange={set("confirm")} placeholder="Repeat your password" autoComplete="new-password" />
          </Field>

          <label className="flex items-start gap-2.5 text-sm text-muted">
            <Box checked={tos} onClick={() => setTos((v) => !v)} />
            <span>I agree to the <Link href="/terms" className="text-brand hover:underline">terms and conditions</Link>.</span>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-muted">
            <Box checked={privacy} onClick={() => setPrivacy((v) => !v)} />
            <span>I accept the <Link href="/privacy" className="text-brand hover:underline">privacy agreement</Link>.</span>
          </label>

          {err && <p className="text-sm text-danger">{err}</p>}

          <button type="submit" disabled={busy} className="btn-brand w-full py-2.5 text-sm disabled:opacity-60">
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already have one? <Link href="/login" className="text-brand hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-faint">{label}</label>
      {children}
    </div>
  );
}

function Box({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${
        checked ? "border-brand bg-brand text-ink" : "border-line"
      }`}
    >
      {checked && <Check size={11} strokeWidth={3} />}
    </button>
  );
}
