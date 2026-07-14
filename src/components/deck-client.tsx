"use client";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark } from "./logo";
import {
  ArrowLeft, ArrowRight, Layers, ShieldCheck, Undo2, ArrowUpRight,
} from "lucide-react";

const TX_DONATE =
  "https://solscan.io/tx/Xc1ExF3gsfKcRTMrgeHXNNeMDGPUKpV3rNJrHKzkJnBskW6C8syNv3y6qqjkyjL4hHXmMTXA4oBQLqTfNP1bZ6F?cluster=devnet";
const TX_RELEASE =
  "https://solscan.io/tx/STZwhfH7RdFzseR5ACqRKyNW9EaQ69mQNhXVsTrqeM5uqS5486sbgsaqduzRba7mAS54stDxRbhDYaXaq1mT1y5?cluster=devnet";

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium tracking-wide text-brand">{children}</p>;
}
function H(props: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
      {props.children}
    </h2>
  );
}
function P(props: { children: React.ReactNode }) {
  return (
    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
      {props.children}
    </p>
  );
}

const SLIDES: Array<() => React.ReactNode> = [
  // 1 — title
  () => (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <LogoMark size={72} />
      <h1 className="mt-8 text-5xl font-semibold tracking-tight sm:text-7xl">
        <span className="brand-text">Dia</span>fund
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted sm:text-xl">
        Giving you can follow to the end.
      </p>
      <p className="mono mt-10 text-xs text-faint">
        Solana devnet · diafund.vercel.app
      </p>
    </div>
  ),
  // 2 — problem
  () => (
    <div>
      <Kicker>The problem</Kicker>
      <H>People stopped trusting where donations go.</H>
      <P>
        Money enters a foundation and disappears into a black box. Scandal after
        scandal has trained donors to assume the worst, so many simply stop giving.
        The honest operators pay the price for the dishonest ones.
      </P>
      <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
        {[
          ["Donate", "visible"],
          ["Spend", "black box"],
          ["Deliver", "black box"],
        ].map(([step, state]) => (
          <div key={step} className={`card p-5 text-center ${state === "black box" ? "opacity-50" : "border-brand/40"}`}>
            <div className="text-sm font-semibold">{step}</div>
            <div className={`mono mt-1 text-xs ${state === "black box" ? "text-danger" : "text-brand"}`}>{state}</div>
          </div>
        ))}
      </div>
    </div>
  ),
  // 3 — insight
  () => (
    <div>
      <Kicker>The insight</Kicker>
      <H>Transparency is not proof.</H>
      <P>
        Every &ldquo;charity on the blockchain&rdquo; project shows that money moved
        between wallets. That proves custody changed, not that a well was dug or a
        student stayed in school. Trust actually breaks at the last mile, where crypto
        becomes cash and cash becomes goods — and no explorer can see that stretch.
      </P>
      <P>
        So we stopped trying to make transfers more visible, and made the money itself
        refuse to move without evidence.
      </P>
    </div>
  ),
  // 4 — solution
  () => (
    <div>
      <Kicker>The product</Kicker>
      <H>Escrow that pays out against proof, not promises.</H>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Layers, t: "Staged escrow", d: "Donors fund milestones, not organizations. Vaults unlock tranche by tranche — nobody can drain the full amount up front." },
          { icon: ShieldCheck, t: "Independent proof", d: "A verifier who is not the recipient signs each delivery. The proof is hashed and anchored in the on-chain release memo." },
          { icon: Undo2, t: "Deadline refunds", d: "No proof by the deadline means the remaining balance is marked refundable to the original donors." },
        ].map((c) => (
          <div key={c.t} className="card p-6">
            <c.icon size={20} className="text-brand" />
            <h3 className="mt-4 text-base font-semibold">{c.t}</h3>
            <p className="mt-2 text-sm text-muted">{c.d}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  // 5 — how it works
  () => (
    <div>
      <Kicker>How it works</Kicker>
      <H>Hub → Pad → Milestone → Proof → Release.</H>
      <div className="mt-10 space-y-3">
        {[
          ["01", "A hub opens a pad and splits its budget into milestones, each with a proof requirement."],
          ["02", "Donors back specific milestones in SOL or dUSDC. Funds land in the pad vault on Solana."],
          ["03", "An independent verifier signs proof of delivery; its SHA-256 hash is recorded."],
          ["04", "The vault releases the tranche, tagged on-chain with the exact proof it cleared against."],
        ].map(([n, t]) => (
          <div key={n} className="flex items-start gap-4">
            <span className="mono mt-0.5 text-sm text-brand">{n}</span>
            <p className="max-w-2xl text-base text-muted">{t}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  // 6 — live proof
  () => (
    <div>
      <Kicker>Not a mockup</Kicker>
      <H>The full cycle already ran on devnet.</H>
      <P>
        A real 800 dUSDC donation entered a pad vault, a proof was hashed and anchored,
        and the tranche released to the beneficiary. Both transactions are permanent
        and public.
      </P>
      <div className="mt-8 flex flex-col gap-3">
        <a href={TX_DONATE} target="_blank" rel="noreferrer" className="card flex items-center justify-between p-4 hover:border-brand/50">
          <span className="text-sm">Donation into the vault</span>
          <span className="mono flex items-center gap-1 text-xs text-brand">Xc1ExF3g…P1bZ6F <ArrowUpRight size={12} /></span>
        </a>
        <a href={TX_RELEASE} target="_blank" rel="noreferrer" className="card flex items-center justify-between p-4 hover:border-brand/50">
          <span className="text-sm">Release with the proof hash in the memo</span>
          <span className="mono flex items-center gap-1 text-xs text-brand">STZwhfH7…mT1y5 <ArrowUpRight size={12} /></span>
        </a>
      </div>
      <p className="mt-6 text-sm text-faint">
        Live app: accounts, operator console, faucet, and a plain-language ledger written by an LLM from real chain data.
      </p>
    </div>
  ),
  // 7 — why now / market
  () => (
    <div>
      <Kicker>Why this wins</Kicker>
      <H>Trust is the product. Rails are the moat.</H>
      <P>
        Indonesia is one of the most generous countries on earth by giving rate, yet
        institutional distrust caps how much flows. Every proven release compounds a
        public track record that a spreadsheet or a bank statement can never match.
      </P>
      <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
        {[
          ["Donors", "give with a guarantee, not a hope"],
          ["Operators", "convert honesty into more funding"],
          ["Verifiers", "a new role the rails pay for"],
        ].map(([who, what]) => (
          <div key={who} className="card p-5">
            <div className="text-sm font-semibold text-brand">{who}</div>
            <p className="mt-1.5 text-sm text-muted">{what}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  // 8 — roadmap + team
  () => (
    <div>
      <Kicker>Roadmap and team</Kicker>
      <H>From working MVP to public rails.</H>
      <div className="mt-8 space-y-2.5 text-base text-muted">
        <p>Now — full flow live on devnet: escrow, proof anchoring, releases, accounts.</p>
        <p>Next — PDA-owned vaults in an Anchor program, so rules are enforced by code.</p>
        <p>Then — verifier staking, fiat off-ramp receipts, recurring giving, mainnet.</p>
      </div>
      <div className="mt-10 border-t border-line pt-6">
        <p className="text-sm text-fg">
          <span className="font-semibold">Christian Alexander Wongso</span> — idea and concept owner
        </p>
        <p className="mt-1 text-sm text-muted">
          <span className="font-semibold text-fg">Vincentius Bryan Kwandou</span> — PIC, Superteam Campus Club, Universitas Atma Jaya Makassar
        </p>
        <p className="mono mt-6 text-xs text-faint">diafund.vercel.app · github.com/nayrbryanGaming/diafund</p>
      </div>
    </div>
  ),
];

export function DeckClient() {
  const [i, setI] = useState(0);
  const n = SLIDES.length;
  const go = useCallback((d: number) => setI((p) => Math.min(n - 1, Math.max(0, p + d))), [n]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") go(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go]);

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      <div className="aurora" />
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {SLIDES[i]()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative mx-auto mb-8 flex w-full max-w-4xl items-center justify-between px-6">
        <div className="flex gap-1.5">
          {SLIDES.map((_, j) => (
            <button
              key={j}
              onClick={() => setI(j)}
              aria-label={`Slide ${j + 1}`}
              className={`h-1.5 rounded-full transition-all ${j === i ? "w-6 bg-brand" : "w-1.5 bg-line hover:bg-line-2"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="mono mr-2 text-xs text-faint">{i + 1} / {n}</span>
          <button onClick={() => go(-1)} disabled={i === 0} className="chip grid h-9 w-9 place-items-center text-muted disabled:opacity-30 hover:border-brand/50">
            <ArrowLeft size={16} />
          </button>
          <button onClick={() => go(1)} disabled={i === n - 1} className="btn-brand grid h-9 w-9 place-items-center disabled:opacity-30">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
