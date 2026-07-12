// Public config, safe for the browser. Only NEXT_PUBLIC_* values belong here.
export const CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";

export const TREASURY_PUBKEY =
  process.env.NEXT_PUBLIC_TREASURY_PUBKEY ||
  "35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr";

export const DEVNET_USDC_MINT =
  process.env.NEXT_PUBLIC_DEVNET_USDC_MINT ||
  "75ENcpvcrtpXbzpJgjibHBW55hxPTKbABnstNuXyzJqL";

// Memo program is the same across clusters.
export const MEMO_PROGRAM_ID = "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo";

export function solscanTx(sig: string) {
  return `https://solscan.io/tx/${sig}?cluster=${CLUSTER}`;
}
export function solscanAddress(addr: string) {
  return `https://solscan.io/account/${addr}?cluster=${CLUSTER}`;
}
