"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Hub } from "@/lib/types";
import { Plus, Trash2, ShieldCheck, EyeOff, Globe } from "lucide-react";

interface MsRow {
  title: string;
  detail: string;
  amount: string;
  deadlineDays: string;
}

const emptyMs = (): MsRow => ({ title: "", detail: "", amount: "", deadlineDays: "21" });

export function CreatePadClient({ hubs }: { hubs: Hub[] }) {
  const router = useRouter();
  // Anti-bot: captured once on mount; the API requires a human-scale delay.
  const [startedAt] = useState(() => Date.now());
  const [f, setF] = useState({
    hubId: hubs[0]?.id || "",
    title: "",
    summary: "",
    category: "General",
    location: "",
    asset: "SOL" as "SOL" | "USDC",
    goal: "",
    beneficiary: "",
    visibility: "public" as "public" | "unlisted",
    website: "", // honeypot — stays empty for humans
    agree: false,
  });
  const [ms, setMs] = useState<MsRow[]>([emptyMs()]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  const set = (k: keyof typeof f) => (e: any) =>
    setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));

  const msTotal = useMemo(
    () => ms.reduce((s, m) => s + (Number(m.amount) || 0), 0),
    [ms]
  );
  const goalNum = Number(f.goal) || 0;
  const sumsMatch = goalNum > 0 && Math.abs(msTotal - goalNum) <= goalNum * 0.01;

  async function submit() {
    setErr("");
    if (!f.agree) {
      setErr("Please confirm the honesty pledge first.");
      return;
    }
    if (!sumsMatch) {
      setErr(`Milestone amounts (${msTotal}) must add up to the goal (${f.goal || 0}).`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/pads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          goal: goalNum,
          formStartedAt: startedAt,
          milestones: ms.map((m) => ({
            title: m.title,
            detail: m.detail,
            amount: Number(m.amount),
            deadlineDays: Number(m.deadlineDays),
          })),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "could not create the pad");
      if (j.review) {
        setNotice(j.review);
      } else {
        router.push(`/pad/${j.pad.id}`);
      }
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  if (notice) {
    return (
      <div className="card mt-8 p-6">
        <div className="flex items-center gap-2 text-brand">
          <ShieldCheck size={18} />
          <span className="font-medium">Held for a quick review</span>
        </div>
        <p className="mt-2 text-sm text-muted">{notice}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* honeypot — visually hidden, bots fill it, humans never see it */}
      <input
        type="text"
        name="website"
        value={f.website}
        onChange={set("website")}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="card grid gap-4 p-6 md:grid-cols-2">
        <label className="block text-sm md:col-span-2">
          <span className="text-muted">Pad title</span>
          <input className="df-input mt-1" value={f.title} onChange={set("title")} placeholder="Clean water for 3 villages in Sumba" />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="text-muted">What is the money for? (min 40 characters)</span>
          <textarea className="df-input mt-1" rows={3} value={f.summary} onChange={set("summary")} placeholder="Describe the cause, who benefits, and how delivery will be proven." />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Hub</span>
          <select className="df-input mt-1" value={f.hubId} onChange={set("hubId")}>
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-muted">Category</span>
          <input className="df-input mt-1" value={f.category} onChange={set("category")} />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Location</span>
          <input className="df-input mt-1" value={f.location} onChange={set("location")} placeholder="Makassar, Indonesia" />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Asset</span>
          <select className="df-input mt-1" value={f.asset} onChange={set("asset")}>
            <option value="SOL">SOL</option>
            <option value="USDC">dUSDC</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-muted">Goal ({f.asset})</span>
          <input className="df-input mt-1" value={f.goal} onChange={set("goal")} inputMode="decimal" placeholder="10" />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Beneficiary wallet (devnet)</span>
          <input className="df-input mono mt-1 text-xs" value={f.beneficiary} onChange={set("beneficiary")} placeholder="wallet that receives released funds" />
        </label>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Milestones</h2>
          <span className={`text-xs ${sumsMatch ? "text-brand" : "text-faint"}`}>
            {msTotal} / {f.goal || 0} {f.asset} allocated
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          Split the budget into stages. Each stage is escrowed and only released
          after an independent verifier proves delivery.
        </p>
        <div className="mt-4 space-y-3">
          {ms.map((m, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-line/60 p-3 md:grid-cols-[1fr_1fr_110px_90px_36px]">
              <input className="df-input" placeholder={`Milestone ${i + 1} title`} value={m.title}
                onChange={(e) => setMs((s) => s.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <input className="df-input" placeholder="What will be delivered?" value={m.detail}
                onChange={(e) => setMs((s) => s.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)))} />
              <input className="df-input" placeholder={`Amount`} inputMode="decimal" value={m.amount}
                onChange={(e) => setMs((s) => s.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
              <input className="df-input" placeholder="Days" inputMode="numeric" value={m.deadlineDays}
                onChange={(e) => setMs((s) => s.map((x, j) => (j === i ? { ...x, deadlineDays: e.target.value } : x)))} />
              <button onClick={() => setMs((s) => s.filter((_, j) => j !== i))} disabled={ms.length === 1}
                className="flex items-center justify-center rounded-lg border border-line/60 text-faint hover:text-fg disabled:opacity-40">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setMs((s) => [...s, emptyMs()])} disabled={ms.length >= 12}
          className="chip mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted hover:text-fg disabled:opacity-40">
          <Plus size={13} /> Add milestone
        </button>
      </div>

      <div className="card p-6">
        <h2 className="font-medium">Visibility</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => set("visibility")("public")}
            className={`chip flex items-center gap-1.5 px-3 py-1.5 text-sm ${f.visibility === "public" ? "border-brand/60 text-brand" : "text-muted"}`}>
            <Globe size={14} /> Public — listed on Explore
          </button>
          <button onClick={() => set("visibility")("unlisted")}
            className={`chip flex items-center gap-1.5 px-3 py-1.5 text-sm ${f.visibility === "unlisted" ? "border-brand/60 text-brand" : "text-muted"}`}>
            <EyeOff size={14} /> Private — invite link only
          </button>
        </div>
        {f.visibility === "unlisted" && (
          <p className="mt-2 text-xs text-muted">
            The pad will not appear on Explore. Only people with the direct link can see and back it.
          </p>
        )}
      </div>

      <label className="flex items-start gap-2.5 text-sm text-muted">
        <input type="checkbox" checked={f.agree} onChange={(e) => setF((s) => ({ ...s, agree: e.target.checked }))} className="mt-0.5" />
        <span>
          I confirm this cause is real, the beneficiary wallet is correct, and I
          understand pads that trip anti-fraud screening are held for review and
          that all escrow activity is public on Solana devnet.
        </span>
      </label>

      {err && <p className="text-sm text-red-400">{err}</p>}

      <button onClick={submit} disabled={busy} className="btn-brand px-6 py-2.5 text-sm disabled:opacity-60">
        {busy ? "Creating…" : "Open the pad"}
      </button>
    </div>
  );
}
