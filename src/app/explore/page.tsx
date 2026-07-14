import { explorePads, listHubs } from "@/lib/db";
import { PadCard } from "@/components/pad-card";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

export const metadata = { title: "Explore pads — Diafund" };
export const dynamic = "force-dynamic";

export default async function Explore() {
  const [pads, hubs] = await Promise.all([explorePads(), listHubs()]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">Open funding pads</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Each pad is a single cause with a budget split into milestones. Back the
          tranches you care about. Money only moves when the work is proven.
        </p>
      </Reveal>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="chip px-3 py-1 text-xs text-brand">All</span>
        {hubs.map((h) => (
          <a key={h.id} href={`/hub/${h.id}`} className="chip px-3 py-1 text-xs text-muted transition-colors hover:border-brand/50 hover:text-fg">
            {h.name}
          </a>
        ))}
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
