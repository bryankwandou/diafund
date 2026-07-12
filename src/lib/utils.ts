import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddr(a?: string, n = 4) {
  if (!a) return "";
  return `${a.slice(0, n)}…${a.slice(-n)}`;
}

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
export function amount(n: number, asset: string) {
  return `${fmt.format(n)} ${asset === "USDC" ? "dUSDC" : asset}`;
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
