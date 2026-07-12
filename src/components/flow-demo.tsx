"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowDownToLine, Lock, ShieldCheck, HandCoins } from "lucide-react";

const STAGES = [
  {
    key: "in",
    title: "Donation arrives",
    body: "A donor funds a specific milestone. The transfer lands on-chain with a memo tag.",
    icon: ArrowDownToLine,
    tag: "diafund:donate",
  },
  {
    key: "escrow",
    title: "Held in the pad vault",
    body: "Money waits in the pad's vault. Nothing moves until the work is proven.",
    icon: Lock,
    tag: "vault balance",
  },
  {
    key: "proof",
    title: "Proof of delivery",
    body: "An independent verifier signs off. The proof file is hashed and anchored on-chain.",
    icon: ShieldCheck,
    tag: "sha256 anchored",
  },
  {
    key: "out",
    title: "Released to the beneficiary",
    body: "Only then does the tranche pay out. The donor can open every hop on Solscan.",
    icon: HandCoins,
    tag: "diafund:release",
  },
];

export function FlowDemo() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-sm font-medium text-muted">The path of one donation</span>
        <span className="flex items-center gap-2 text-xs text-faint">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-brand" />
          live
        </span>
      </div>

      <div className="flex items-stretch gap-2">
        {STAGES.map((s, i) => {
          const on = i === active;
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex flex-1 items-center gap-2">
              <motion.div
                className="relative flex-1 rounded-xl border p-3 text-center"
                animate={{
                  borderColor: on ? "rgba(53,229,196,0.6)" : "rgba(29,39,53,1)",
                  backgroundColor: on ? "rgba(53,229,196,0.06)" : "rgba(255,255,255,0)",
                  scale: on ? 1.03 : 1,
                }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg border"
                  animate={{
                    borderColor: on ? "rgba(53,229,196,0.6)" : "rgba(29,39,53,1)",
                    color: on ? "#35e5c4" : "#63718a",
                  }}
                >
                  <Icon size={17} />
                </motion.div>
                <div className="text-[11px] font-medium leading-tight text-fg">
                  {s.title}
                </div>
                <div className="mono mt-1 text-[9px] text-faint">{s.tag}</div>
              </motion.div>
              {i < STAGES.length - 1 && (
                <div className="relative hidden h-px w-6 shrink-0 overflow-hidden bg-line sm:block">
                  {i === active && <div className="flow-line absolute inset-0" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 min-h-[44px] rounded-lg bg-ink-2/60 p-3">
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="text-sm text-muted"
          >
            {STAGES[active].body}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
