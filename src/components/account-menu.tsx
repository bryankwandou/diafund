"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, LayoutDashboard, SlidersHorizontal } from "lucide-react";

export function AccountMenu({ username, role }: { username: string; role: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="chip flex items-center gap-1.5 px-3 py-1.5 text-sm text-fg hover:border-brand/50"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand/20 text-[10px] font-semibold text-brand">
          {username.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-[110px] truncate">{username}</span>
        <ChevronDown size={13} className="text-faint" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-fg">
            <LayoutDashboard size={15} /> Dashboard
          </Link>
          {role === "admin" && (
            <Link href="/console" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-fg">
              <SlidersHorizontal size={15} /> Operator console
            </Link>
          )}
          <button onClick={logout} className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-danger">
            <LogOut size={15} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
