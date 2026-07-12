import Link from "next/link";
import type { Pad } from "@/lib/types";
import { ProgressBar, PadStatusBadge } from "./ui";
import { amount } from "@/lib/utils";
import { MapPin } from "lucide-react";

export function PadCard({ pad }: { pad: Pad }) {
  const pct = pad.goal > 0 ? (pad.raised / pad.goal) * 100 : 0;
  return (
    <Link
      href={`/pad/${pad.id}`}
      className="card group flex flex-col p-5 transition-colors hover:border-brand/40"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="chip px-2.5 py-0.5 text-[11px] text-brand">{pad.category}</span>
        <PadStatusBadge status={pad.status} />
      </div>
      <h3 className="text-base font-semibold leading-snug text-fg group-hover:text-brand transition-colors">
        {pad.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{pad.summary}</p>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-faint">
        <MapPin size={12} /> {pad.location}
      </div>
      <div className="mt-4 space-y-2">
        <ProgressBar value={pct} />
        <div className="flex items-center justify-between text-xs">
          <span className="text-fg">{amount(pad.raised, pad.asset)}</span>
          <span className="text-faint">of {amount(pad.goal, pad.asset)}</span>
        </div>
      </div>
    </Link>
  );
}
