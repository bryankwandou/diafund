import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listHubs, listPads, getPadDetail } from "@/lib/db";
import { ConsoleClient } from "@/components/console-client";
import { TREASURY_PUBKEY } from "@/lib/config";

export const metadata = { title: "Operator console — Diafund" };
export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold">Operators only</h1>
        <p className="mt-2 text-sm text-muted">
          The console is where hubs open pads and clear milestones. Your account does not
          have operator access yet.
        </p>
      </div>
    );
  }

  const hubs = await listHubs();
  const pads = await listPads();
  const details = await Promise.all(pads.map((p) => getPadDetail(p.id)));

  const padViews = details
    .filter(Boolean)
    .map((d) => ({
      id: d!.id,
      title: d!.title,
      asset: d!.asset,
      milestones: d!.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        amount: m.amount,
        status: m.status,
        releaseSig: m.releaseSig,
      })),
    }));

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Operator console</h1>
      <p className="mt-1 text-sm text-muted">
        Register hubs, open funding pads, and clear milestones against proof.
      </p>
      <ConsoleClient
        hubs={hubs.map((h) => ({ id: h.id, name: h.name }))}
        pads={padViews}
        defaultSteward={TREASURY_PUBKEY}
      />
    </div>
  );
}
