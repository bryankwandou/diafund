import type { Asset, Donation } from "./types";

// Maps raw donation rows (optionally joined with the pad title) to typed objects.
export function toDonationRows(
  rows: Record<string, unknown>[]
): (Donation & { padTitle?: string })[] {
  return rows.map((r) => ({
    id: String(r.id),
    padId: String(r.pad_id),
    donor: String(r.donor),
    asset: r.asset as Asset,
    amount: Number(r.amount ?? 0),
    sig: String(r.sig),
    createdAt: String(r.created_at),
    padTitle: r.pad_title ? String(r.pad_title) : undefined,
  }));
}
