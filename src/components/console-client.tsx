"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MilestoneBadge, TxLink } from "./ui";
import { amount } from "@/lib/utils";
import { Plus, Trash2, Building2, PackagePlus, ListChecks, ShieldAlert } from "lucide-react";

type Hub = { id: string; name: string };
type MS = { id: string; title: string; amount: number; status: string; releaseSig?: string };
type Pad = { id: string; title: string; asset: "SOL" | "USDC"; milestones: MS[] };

const TABS = [
  { k: "hub", label: "New hub", icon: Building2 },
  { k: "pad", label: "New pad", icon: PackagePlus },
  { k: "clear", label: "Milestones", icon: ListChecks },
  { k: "review", label: "Review queue", icon: ShieldAlert },
] as const;

export function ConsoleClient({
  hubs,
  pads,
  defaultSteward,
}: {
  hubs: Hub[];
  pads: Pad[];
  defaultSteward: string;
}) {
  const [tab, setTab] = useState<"hub" | "pad" | "clear" | "review">("clear");

  return (
    <div className="mt-8">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
              tab === t.k ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:text-fg"
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "hub" && <HubForm defaultSteward={defaultSteward} />}
        {tab === "pad" && <PadForm hubs={hubs} defaultBeneficiary="5JTDJdfDHqu3TEHuBTATJF49G8i8YKy42riJG9KWFfSk" />}
        {tab === "clear" && <ClearMilestones pads={pads} />}
        {tab === "review" && <ReviewQueue />}
      </div>
    </div>
  );
}

function useSubmit() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  async function run(url: string, body: unknown) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      setOk(true);
      setMsg("Saved.");
      router.refresh();
      return data;
    } catch (e) {
      setOk(false);
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return { run, busy, msg, ok };
}

function HubForm({ defaultSteward }: { defaultSteward: string }) {
  const [f, setF] = useState({ name: "", steward: defaultSteward, blurb: "" });
  const { run, busy, msg, ok } = useSubmit();
  const set = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div className="card max-w-xl p-6">
      <h2 className="text-base font-semibold">Register a hub</h2>
      <p className="mt-1 text-sm text-muted">A hub is the operator that stewards causes.</p>
      <div className="mt-5 space-y-4">
        <Labeled label="Hub name"><input className="df-input" value={f.name} onChange={set("name")} placeholder="Yayasan Harapan" /></Labeled>
        <Labeled label="Steward wallet"><input className="df-input mono text-xs" value={f.steward} onChange={set("steward")} /></Labeled>
        <Labeled label="Short description"><textarea className="df-input" rows={3} value={f.blurb} onChange={set("blurb")} /></Labeled>
        <button onClick={() => run("/api/hubs", f)} disabled={busy} className="btn-brand px-5 py-2 text-sm disabled:opacity-60">
          {busy ? "Saving…" : "Create hub"}
        </button>
        {msg && <p className={`text-sm ${ok ? "text-released" : "text-danger"}`}>{msg}</p>}
      </div>
    </div>
  );
}

function PadForm({ hubs, defaultBeneficiary }: { hubs: Hub[]; defaultBeneficiary: string }) {
  const [startedAt] = useState(() => Date.now());
  const [f, setF] = useState({
    hubId: hubs[0]?.id || "",
    title: "",
    summary: "",
    category: "Water",
    location: "",
    asset: "USDC" as "SOL" | "USDC",
    goal: "",
    beneficiary: defaultBeneficiary,
  });
  const [ms, setMs] = useState([{ title: "", detail: "", amount: "", deadlineDays: "14" }]);
  const { run, busy, msg, ok } = useSubmit();
  const set = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setM = (i: number, k: string) => (e: any) =>
    setMs((p) => p.map((m, j) => (j === i ? { ...m, [k]: e.target.value } : m)));

  async function submit() {
    await run("/api/pads", {
      ...f,
      goal: Number(f.goal),
      formStartedAt: startedAt,
      milestones: ms.map((m) => ({
        title: m.title,
        detail: m.detail,
        amount: Number(m.amount),
        deadlineDays: Number(m.deadlineDays),
      })),
    });
  }

  return (
    <div className="card max-w-2xl p-6">
      <h2 className="text-base font-semibold">Open a funding pad</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Labeled label="Hub">
          <select className="df-select" value={f.hubId} onChange={set("hubId")}>
            {hubs.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </Labeled>
        <Labeled label="Asset">
          <select className="df-select" value={f.asset} onChange={set("asset")}>
            <option value="USDC">dUSDC</option>
            <option value="SOL">SOL</option>
          </select>
        </Labeled>
        <Labeled label="Title" full><input className="df-input" value={f.title} onChange={set("title")} /></Labeled>
        <Labeled label="Summary" full><textarea className="df-input" rows={2} value={f.summary} onChange={set("summary")} /></Labeled>
        <Labeled label="Category"><input className="df-input" value={f.category} onChange={set("category")} /></Labeled>
        <Labeled label="Location"><input className="df-input" value={f.location} onChange={set("location")} /></Labeled>
        <Labeled label="Goal"><input className="df-input" value={f.goal} onChange={set("goal")} inputMode="decimal" /></Labeled>
        <Labeled label="Beneficiary wallet"><input className="df-input mono text-xs" value={f.beneficiary} onChange={set("beneficiary")} /></Labeled>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Milestones</h3>
          <button onClick={() => setMs((p) => [...p, { title: "", detail: "", amount: "", deadlineDays: "14" }])} className="flex items-center gap-1 text-xs text-brand">
            <Plus size={13} /> Add
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {ms.map((m, i) => (
            <div key={i} className="rounded-lg border border-line p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                <input className="df-input" placeholder="Title" value={m.title} onChange={setM(i, "title")} />
                <input className="df-input w-24" placeholder="Amount" value={m.amount} onChange={setM(i, "amount")} inputMode="decimal" />
                <input className="df-input w-20" placeholder="Days" value={m.deadlineDays} onChange={setM(i, "deadlineDays")} inputMode="numeric" />
                <button onClick={() => setMs((p) => p.filter((_, j) => j !== i))} className="grid place-items-center px-2 text-faint hover:text-danger" title="Remove">
                  <Trash2 size={15} />
                </button>
              </div>
              <input className="df-input mt-2" placeholder="What proof is required" value={m.detail} onChange={setM(i, "detail")} />
            </div>
          ))}
        </div>
      </div>

      <button onClick={submit} disabled={busy} className="btn-brand mt-6 px-5 py-2 text-sm disabled:opacity-60">
        {busy ? "Opening…" : "Open pad"}
      </button>
      {msg && <p className={`mt-3 text-sm ${ok ? "text-released" : "text-danger"}`}>{msg}</p>}
    </div>
  );
}

function ClearMilestones({ pads }: { pads: Pad[] }) {
  return (
    <div className="space-y-5">
      {pads.length === 0 && <p className="text-sm text-muted">No pads yet. Open one first.</p>}
      {pads.map((pad) => (
        <div key={pad.id} className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{pad.title}</h3>
            <span className="chip px-2 py-0.5 text-[11px] text-brand">{pad.asset === "USDC" ? "dUSDC" : "SOL"}</span>
          </div>
          <div className="mt-3 divide-y divide-line">
            {pad.milestones.map((m) => (
              <MilestoneRow key={m.id} m={m} asset={pad.asset} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MilestoneRow({ m, asset }: { m: MS; asset: "SOL" | "USDC" }) {
  const [open, setOpen] = useState(false);
  const [proofText, setProofText] = useState("");
  const [note, setNote] = useState("");
  const { run, busy, msg, ok } = useSubmit();
  const [sig, setSig] = useState<string | undefined>(m.releaseSig);

  async function attest() {
    const r = await run("/api/attest", { milestoneId: m.id, proofText, note });
    if (r?.ok) setOpen(false);
  }
  async function release() {
    const r = await run("/api/release", { milestoneId: m.id });
    if (r?.sig) setSig(r.sig);
  }

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-fg">{m.title}</p>
          <p className="text-xs text-faint">{amount(m.amount, asset)}</p>
        </div>
        <div className="flex items-center gap-3">
          <MilestoneBadge status={m.status as any} />
          {m.status === "locked" && (
            <button onClick={() => setOpen((o) => !o)} className="chip px-3 py-1 text-xs text-fg hover:border-brand/50">
              Submit proof
            </button>
          )}
          {m.status === "proven" && (
            <button onClick={release} disabled={busy} className="btn-brand px-3 py-1 text-xs disabled:opacity-60">
              {busy ? "Releasing…" : "Release now"}
            </button>
          )}
          {(m.status === "released" || sig) && sig && <TxLink sig={sig} />}
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2 rounded-lg border border-line bg-ink-2/50 p-3">
          <input className="df-input" placeholder="Proof reference (receipt no., link, GPS, note)" value={proofText} onChange={(e) => setProofText(e.target.value)} />
          <input className="df-input" placeholder="Optional note for donors" value={note} onChange={(e) => setNote(e.target.value)} />
          <button onClick={attest} disabled={busy || !proofText} className="btn-brand px-4 py-1.5 text-xs disabled:opacity-60">
            {busy ? "Anchoring…" : "Anchor proof on-chain"}
          </button>
          <p className="text-[11px] text-faint">
            The text is hashed with SHA-256. The hash is written into the release memo.
          </p>
        </div>
      )}
      {msg && !ok && <p className="mt-2 text-xs text-danger">{msg}</p>}
    </div>
  );
}

type FlagRow = {
  id: string;
  pad_id: string;
  title: string;
  rule: string;
  detail: string;
  severity: number;
  created_at: string;
};

function ReviewQueue() {
  const [flags, setFlags] = useState<FlagRow[] | null>(null);
  const [err, setErr] = useState("");
  const { run, busy } = useSubmit();

  async function load() {
    try {
      const res = await fetch("/api/flags");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "could not load flags");
      setFlags(j.flags);
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function act(padId: string, action: "approve" | "block") {
    const r = await run("/api/flags", { padId, action });
    if (r?.ok) load();
  }

  if (err) return <p className="text-sm text-danger">{err}</p>;
  if (!flags) return <p className="text-sm text-muted">Loading review queue…</p>;
  if (flags.length === 0)
    return (
      <div className="card max-w-xl p-6 text-sm text-muted">
        The review queue is empty. Pads that trip the anti-fraud screening
        (scam language, high value, velocity, linked wallets) show up here with
        their flags, ready to approve or block.
      </div>
    );

  // group flags per pad
  const byPad = new Map<string, FlagRow[]>();
  for (const f of flags) {
    const arr = byPad.get(f.pad_id) || [];
    arr.push(f);
    byPad.set(f.pad_id, arr);
  }

  return (
    <div className="space-y-4">
      {[...byPad.entries()].map(([padId, rows]) => (
        <div key={padId} className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <a href={`/pad/${padId}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-fg hover:text-brand">
                {rows[0].title}
              </a>
              <p className="mono mt-0.5 text-[11px] text-faint">{padId}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => act(padId, "approve")} disabled={busy} className="btn-brand px-3.5 py-1.5 text-xs disabled:opacity-60">
                Approve — go live
              </button>
              <button onClick={() => act(padId, "block")} disabled={busy} className="chip px-3.5 py-1.5 text-xs text-danger hover:border-danger/50 disabled:opacity-60">
                Block
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {rows.map((f) => (
              <div key={f.id} className="flex items-start gap-2 text-xs">
                <span className={`chip shrink-0 px-2 py-0.5 ${f.severity >= 3 ? "text-danger" : f.severity === 2 ? "text-brand" : "text-muted"}`}>
                  {f.rule} · s{f.severity}
                </span>
                <span className="pt-0.5 text-muted">{f.detail}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Labeled({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-medium text-faint">{label}</label>
      {children}
    </div>
  );
}
