import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { sql } from "@/lib/sql";
import { toDonationRows } from "@/lib/rows";
import { TxLink } from "@/components/ui";
import { amount, timeAgo } from "@/lib/utils";
import { ArrowRight, ShieldCheck, HeartHandshake, Layers, CalendarDays } from "lucide-react";

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const rows = await sql`
    select d.*, p.title as pad_title from donations d
    left join pads p on p.id = d.pad_id
    where d.user_id = ${user.id}
    order by d.created_at desc limit 12`;
  const donations = toDonationRows(rows);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Hi, {user.username}</h1>
            {user.role === "admin" && (
              <span className="chip px-2.5 py-0.5 text-[11px] font-medium text-brand">
                Administrator
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            Member since {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}.
          </p>
        </div>
        {user.role === "admin" ? (
          <Link href="/console" className="btn-brand inline-flex items-center gap-2 px-4 py-2 text-sm">
            Open console <ArrowRight size={15} />
          </Link>
        ) : (
          <Link href="/explore" className="btn-brand inline-flex items-center gap-2 px-4 py-2 text-sm">
            Find a pad <ArrowRight size={15} />
          </Link>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile icon={HeartHandshake} label="Total given" value={amount(user.totalDonated, "USDC")} />
        <Tile icon={Layers} label="Pads backed" value={String(user.padsBacked)} />
        <Tile icon={ShieldCheck} label="Proofs signed" value={String(user.proofsSigned)} />
        <Tile icon={CalendarDays} label="Role" value={user.role === "admin" ? "Full access" : "Donor"} />
      </div>

      <h2 className="mt-12 text-lg font-semibold">Your recent activity</h2>
      <div className="mt-4 card divide-y divide-line">
        {donations.length === 0 && (
          <div className="p-6 text-sm text-muted">
            Nothing here yet. <Link href="/explore" className="text-brand hover:underline">Back your first milestone</Link> and it will show up here with its on-chain receipt.
          </div>
        )}
        {donations.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm text-fg">{(d as any).padTitle || d.padId}</p>
              <p className="text-xs text-faint">{timeAgo(d.createdAt)}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-fg">{amount(d.amount, d.asset)}</span>
              <TxLink sig={d.sig} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="card p-4">
      <Icon size={16} className="text-brand" />
      <div className="mt-3 text-lg font-semibold text-fg">{value}</div>
      <div className="text-xs text-faint">{label}</div>
    </div>
  );
}
