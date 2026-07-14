import { notFound } from "next/navigation";
import Link from "next/link";
import { getPadDetail } from "@/lib/db";
import { DonatePanel } from "@/components/donate-panel";
import { LedgerSummary } from "@/components/ledger-summary";
import { MilestoneBadge, PadStatusBadge, ProgressBar, TxLink } from "@/components/ui";
import { amount, shortAddr, timeAgo } from "@/lib/utils";
import { solscanAddress } from "@/lib/config";
import { MapPin, Building2, ArrowUpRight, FileCheck2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pad = await getPadDetail(id);
  if (!pad) notFound();

  const pct = pad.goal > 0 ? (pad.raised / pad.goal) * 100 : 0;
  const released = pad.milestones.filter((m) => m.status === "released").length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link href="/explore" className="text-sm text-muted hover:text-fg">
        ← Back to pads
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="chip px-2.5 py-0.5 text-[11px] text-brand">{pad.category}</span>
            <PadStatusBadge status={pad.status} />
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{pad.title}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{pad.summary}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-faint">
            <Link href={`/hub/${pad.hub.id}`} className="flex items-center gap-1.5 transition-colors hover:text-fg">
              <Building2 size={14} /> {pad.hub.name}
            </Link>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {pad.location}
            </span>
            <a
              href={solscanAddress(pad.vault)}
              target="_blank"
              rel="noreferrer"
              className="mono flex items-center gap-1 text-brand hover:underline"
            >
              vault {shortAddr(pad.vault)} <ArrowUpRight size={12} />
            </a>
          </div>

          <div className="mt-6 card p-5">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-semibold text-fg">{amount(pad.raised, pad.asset)}</div>
                <div className="text-xs text-faint">raised of {amount(pad.goal, pad.asset)} goal</div>
              </div>
              <div className="text-right text-xs text-faint">
                {released} of {pad.milestones.length} milestones released
              </div>
            </div>
            <ProgressBar value={pct} className="mt-3" />
          </div>

          {/* Trace timeline */}
          <h2 className="mt-10 text-lg font-semibold">The trace</h2>
          <p className="mt-1 text-sm text-muted">
            Every milestone, its proof, and the exact transaction that released it.
          </p>

          <div className="mt-5 space-y-0">
            {pad.milestones.map((m, i) => (
              <div key={m.id} className="relative flex gap-4 pb-6">
                {i < pad.milestones.length - 1 && (
                  <span className="absolute left-[11px] top-6 h-full w-px bg-line" />
                )}
                <span
                  className={`relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 ${
                    m.status === "released"
                      ? "border-released bg-released/20"
                      : m.status === "proven"
                        ? "border-pending bg-pending/20"
                        : "border-line bg-ink"
                  }`}
                />
                <div className="card flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-fg">{m.title}</h3>
                      <p className="mt-1 text-sm text-muted">{m.detail}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-fg">{amount(m.amount, pad.asset)}</div>
                      <div className="mt-1">
                        <MilestoneBadge status={m.status} />
                      </div>
                    </div>
                  </div>
                  {m.proofHash && (
                    <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs text-faint">
                      <FileCheck2 size={13} className="text-brand" />
                      <span>Proof hash</span>
                      <span className="mono truncate text-muted">{m.proofHash.slice(0, 24)}…</span>
                    </div>
                  )}
                  {m.releaseSig && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-faint">Released in</span>
                      <TxLink sig={m.releaseSig} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Donations */}
          <h2 className="mt-8 text-lg font-semibold">Recent donations</h2>
          <div className="mt-4 card divide-y divide-line">
            {pad.donations.length === 0 && (
              <div className="p-5 text-sm text-muted">No donations yet. Be the first.</div>
            )}
            {pad.donations.slice(0, 10).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <span className="mono text-muted">{shortAddr(d.donor)}</span>
                <div className="flex items-center gap-4">
                  <span className="text-fg">{amount(d.amount, d.asset)}</span>
                  <span className="text-faint">{timeAgo(d.createdAt)}</span>
                  <TxLink sig={d.sig} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <DonatePanel padId={pad.id} vault={pad.vault} asset={pad.asset} />
          <LedgerSummary padId={pad.id} />
        </div>
      </div>
    </div>
  );
}
