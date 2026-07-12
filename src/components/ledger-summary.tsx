"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

// Pulls the plain-language account of where the money went. Written by the model
// server-side from the pad's real on-chain and proof data.
export function LedgerSummary({ padId }: { padId: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/ledger/${padId}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) {
          setText(d.summary || "");
          setLoading(false);
        }
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [padId]);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-brand">
        <Sparkles size={15} /> Where this stands, in plain words
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-line" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-line" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-line" />
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted">{text}</p>
      )}
    </div>
  );
}
