import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listHubs } from "@/lib/db";
import { CreatePadClient } from "@/components/create-pad-client";
import { Reveal } from "@/components/motion";

export const metadata = { title: "Start a pad — Diafund" };
export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/create");
  const hubs = await listHubs();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">Start a funding pad</h1>
        <p className="mt-2 text-sm text-muted">
          Anyone with an account can open a pad. No ID checks — instead, every
          pad is screened automatically: velocity limits, scam-language and
          high-value detection, and auto-flagging for human review. Funds sit in
          escrow and only move after an independent verifier proves delivery.
        </p>
      </Reveal>
      <CreatePadClient hubs={hubs} />
    </div>
  );
}
