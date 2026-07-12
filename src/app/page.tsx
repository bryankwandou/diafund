import Link from "next/link";
import { listPads, stats } from "@/lib/db";
import { FlowDemo } from "@/components/flow-demo";
import { PadCard } from "@/components/pad-card";
import { Reveal, Stagger, StaggerItem, CountUp } from "@/components/motion";
import { solscanAddress, TREASURY_PUBKEY } from "@/lib/config";
import {
  ArrowRight,
  Layers,
  ShieldCheck,
  Undo2,
  Building2,
  Coins,
  BadgeCheck,
  ArrowUpRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const pads = await listPads();
  const s = await stats();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="aurora animate-drift" />
        <div className="absolute inset-0 grid-lines" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-16 md:grid-cols-2 md:pt-24">
          <div>
            <Reveal>
              <span className="chip inline-flex items-center gap-2 px-3 py-1 text-xs text-muted">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-brand" />
                Escrowed giving on Solana devnet
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                Giving you can
                <br />
                follow <span className="brand-text">to the end</span>.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
                Most donation trackers stop at the moment money leaves a wallet. That
                only tells you it moved, not that it did anything. Diafund holds each
                donation in escrow and pays it out one milestone at a time, after
                someone independent proves the work was actually delivered.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/explore" className="btn-brand inline-flex items-center gap-2 px-5 py-2.5 text-sm">
                  Explore pads <ArrowRight size={16} />
                </Link>
                <Link
                  href="/#how"
                  className="chip inline-flex items-center gap-2 px-5 py-2.5 text-sm text-fg hover:border-brand/50"
                >
                  How it works
                </Link>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <FlowDemo />
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-line/60 bg-ink-2/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 md:grid-cols-4">
          <Stat label="Active hubs" value={<CountUp to={s.hubs} />} />
          <Stat label="Funding pads" value={<CountUp to={s.pads} />} />
          <Stat label="Milestones tracked" value={<CountUp to={s.milestonesTotal} />} />
          <Stat label="Tranches released" value={<CountUp to={s.milestonesReleased} />} />
        </div>
      </section>

      {/* Insight */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <p className="text-sm font-medium text-brand">The gap nobody closes</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Transparency is not the same as proof.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Reveal delay={0.05}>
            <div className="card h-full p-6">
              <p className="text-sm font-medium text-faint">A plain on-chain transfer says</p>
              <p className="mt-2 text-lg text-fg">
                &ldquo;The money left wallet A and reached wallet B.&rdquo;
              </p>
              <p className="mt-3 text-sm text-muted">
                It cannot tell you whether a well was dug, a student paid their fees, or
                a family was fed. The trust breaks at the last mile, where crypto turns
                into cash and cash turns into goods.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card h-full border-brand/30 p-6">
              <p className="text-sm font-medium text-brand">Diafund says</p>
              <p className="mt-2 text-lg text-fg">
                &ldquo;This tranche paid out because this proof was signed and anchored.&rdquo;
              </p>
              <p className="mt-3 text-sm text-muted">
                Money is released against evidence, not promises. Every release carries
                the fingerprint of the proof that unlocked it, right there on the
                explorer.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-line/60 bg-ink-2/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <p className="text-sm font-medium text-brand">How it works</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Four steps, all on the record.
            </h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              { n: "01", icon: Building2, t: "A hub opens a pad", d: "An operator registers a cause and breaks its budget into milestones with proof requirements." },
              { n: "02", icon: Coins, t: "Donors fund milestones", d: "You back specific tranches in SOL or dUSDC. The money lands in the pad vault, not an inbox." },
              { n: "03", icon: BadgeCheck, t: "A verifier proves delivery", d: "Someone independent signs the proof of work done. Its hash is written on-chain." },
              { n: "04", icon: Coins, t: "The vault releases", d: "The tranche pays out to the beneficiary, tagged with the proof it was cleared against." },
            ].map((step) => (
              <StaggerItem key={step.n}>
                <div className="card h-full p-5">
                  <div className="flex items-center justify-between">
                    <step.icon size={18} className="text-brand" />
                    <span className="mono text-xs text-faint">{step.n}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-fg">{step.t}</h3>
                  <p className="mt-1.5 text-sm text-muted">{step.d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Trust primitives */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Three guarantees, built into the rails.
          </h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: Layers, t: "Staged escrow", d: "Donors fund milestones, not organizations. A bad actor can never grab the whole amount up front. It unlocks tranche by tranche." },
            { icon: ShieldCheck, t: "Independent proof", d: "The person who signs the proof is not the person who receives the money. Proof files are hashed, so the record cannot be quietly rewritten." },
            { icon: Undo2, t: "Deadline refunds", d: "If a milestone is never proven by its deadline, the remaining balance is marked refundable to the original donors." },
          ].map((c) => (
            <StaggerItem key={c.t}>
              <div className="card h-full p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand/30 text-brand">
                  <c.icon size={19} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-fg">{c.t}</h3>
                <p className="mt-2 text-sm text-muted">{c.d}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Featured pads */}
      <section className="mx-auto max-w-6xl px-5 pb-4">
        <Reveal>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Pads open right now
            </h2>
            <Link href="/explore" className="text-sm text-brand hover:underline">
              See all
            </Link>
          </div>
        </Reveal>
        <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
          {pads.map((p) => (
            <StaggerItem key={p.id}>
              <PadCard pad={p} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* On-chain proof band */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <div className="card flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                None of this is on our word.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted">
                Every donation and release is a real transaction on Solana devnet. The
                treasury that settles releases is a public address you can open right
                now.
              </p>
            </div>
            <a
              href={solscanAddress(TREASURY_PUBKEY)}
              target="_blank"
              rel="noreferrer"
              className="btn-brand inline-flex shrink-0 items-center gap-2 px-5 py-2.5 text-sm"
            >
              Open on Solscan <ArrowUpRight size={16} />
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-ink px-5 py-8 text-center">
      <div className="text-3xl font-semibold tracking-tight text-fg">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-faint">{label}</div>
    </div>
  );
}
