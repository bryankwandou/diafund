import { notFound } from "next/navigation";
import Link from "next/link";
import { getHub, listPads } from "@/lib/db";
import { PadCard } from "@/components/pad-card";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { solscanAddress } from "@/lib/config";
import { shortAddr } from "@/lib/utils";
import { ArrowUpRight, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hub = await getHub(id);
  if (!hub) notFound();
  const pads = (await listPads()).filter((p) => p.hubId === id);

  const total = pads.reduce((s, p) => s + p.raised, 0);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Link href="/explore" className="text-sm text-muted hover:text-fg">← All pads</Link>
      <Reveal>
        <div className="mt-4 flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-brand/30 text-brand">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{hub.name}</h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted">{hub.blurb}</p>
            <a
              href={solscanAddress(hub.steward)}
              target="_blank"
              rel="noreferrer"
              className="mono mt-2 inline-flex items-center gap-1 text-xs text-brand hover:underline"
            >
              steward {shortAddr(hub.steward)} <ArrowUpRight size={11} />
            </a>
          </div>
        </div>
      </Reveal>

      <div className="mt-8 flex gap-8 border-y border-line py-5 text-sm">
        <div><span className="text-lg font-semibold text-fg">{pads.length}</span> <span className="text-faint">pads</span></div>
        <div><span className="text-lg font-semibold text-fg">{total.toLocaleString()}</span> <span className="text-faint">raised across assets</span></div>
      </div>

      <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
        {pads.map((p) => (
          <StaggerItem key={p.id}>
            <PadCard pad={p} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
