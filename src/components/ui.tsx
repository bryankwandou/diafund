import { cn } from "@/lib/utils";
import type { MilestoneStatus, PadStatus } from "@/lib/types";
import { solscanTx } from "@/lib/config";
import { shortAddr } from "@/lib/utils";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-line", className)}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg,var(--color-brand),var(--color-brand-2))",
        }}
      />
    </div>
  );
}

const MS_STYLE: Record<MilestoneStatus, string> = {
  locked: "text-faint border-line",
  proven: "text-pending border-pending/40 bg-pending/10",
  released: "text-released border-released/40 bg-released/10",
  refundable: "text-danger border-danger/40 bg-danger/10",
};
const MS_LABEL: Record<MilestoneStatus, string> = {
  locked: "Locked",
  proven: "Proof in",
  released: "Released",
  refundable: "Refundable",
};

export function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  return (
    <span className={cn("chip px-2.5 py-0.5 text-[11px] font-medium", MS_STYLE[status])}>
      {MS_LABEL[status]}
    </span>
  );
}

const PAD_LABEL: Record<PadStatus, string> = {
  open: "Open",
  funded: "Funded",
  delivering: "Delivering",
  closed: "Closed",
};
export function PadStatusBadge({ status }: { status: PadStatus }) {
  return (
    <span className="chip px-2.5 py-0.5 text-[11px] font-medium text-muted">
      {PAD_LABEL[status]}
    </span>
  );
}

export function TxLink({ sig, children }: { sig: string; children?: React.ReactNode }) {
  return (
    <a
      href={solscanTx(sig)}
      target="_blank"
      rel="noreferrer"
      className="mono text-xs text-brand hover:underline"
    >
      {children || shortAddr(sig, 6)}
    </a>
  );
}
