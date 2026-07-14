<div align="center">

# Diafund

**Giving you can follow to the end.**

Escrowed, milestone-gated donations on Solana. Money is released one tranche at a
time, only after an independent verifier signs proof that it reached its purpose.

[Live site](https://diafund.vercel.app) · [Solana devnet](https://solscan.io/account/35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr?cluster=devnet)

</div>

---

## Submission at a glance

| | |
|---|---|
| **Project** | Diafund |
| **One-liner** | Diafund escrows every donation on Solana and pays it out milestone by milestone, only after an independent verifier proves the money reached the people it was meant for. |
| **Deck / website** | https://diafund.vercel.app |
| **Network** | Solana devnet (SOL and a dUSDC test asset) |
| **Concept & idea owner** | Christian Alexander Wongso |
| **PIC (Superteam Campus Club, Universitas Atma Jaya Makassar)** | Vincentius Bryan Kwandou — facilitated turning the idea into a working product |


A demo account with full operator access (register hubs, open pads, anchor proofs,
trigger on-chain releases) is provided to judges privately through the submission
form. Credentials are not published in this repository.

---

## The problem we actually solve

Most "donation on the blockchain" projects stop at showing that money moved from one
wallet to another. That proves custody changed hands. It does not prove a well was
dug, a student paid their fees, or a family was fed. Trust breaks at the last mile,
where crypto turns into cash and cash turns into goods, and a plain block explorer
cannot see any of it.

Diafund closes that gap with programmable trust rather than transparency theater:

- **Staged escrow.** A donor funds milestones, not an organization. Money sits in a
  pad vault and unlocks tranche by tranche. Nobody can drain the whole amount up front.
- **Independent proof of delivery.** Each release is gated by an attestation signed by
  a verifier who is not the recipient. The proof document is hashed with SHA-256 and
  the hash is written into the on-chain release memo, so the evidence cannot be quietly
  rewritten later.
- **Deadline refunds.** If a milestone is never proven by its deadline, the remaining
  balance is marked refundable to the original donors.

## Product vocabulary

- **Hub** — an operator or foundation that stewards causes.
- **Pad** — a single campaign vault under a hub. Donations land here.
- **Milestone** — a tranche of a pad's budget, with an amount and a required proof.
- **Attestation** — a verifier-signed proof of delivery, anchored on-chain by its hash.
- **Trace** — the public timeline a donor reads to see where the money went.

## Proof that it runs on Solana devnet

The end-to-end flow was executed on devnet against a live dUSDC mint. Both are real,
permanent transactions:

- **Donation into the pad vault** — [`Xc1ExF3g…P1bZ6F`](https://solscan.io/tx/Xc1ExF3gsfKcRTMrgeHXNNeMDGPUKpV3rNJrHKzkJnBskW6C8syNv3y6qqjkyjL4hHXmMTXA4oBQLqTfNP1bZ6F?cluster=devnet)
- **Milestone release with the proof hash in the memo** — [`STZwhfH7…mT1y5`](https://solscan.io/tx/STZwhfH7RdFzseR5ACqRKyNW9EaQ69mQNhXVsTrqeM5uqS5486sbgsaqduzRba7mAS54stDxRbhDYaXaq1mT1y5?cluster=devnet)

Key devnet addresses:

- Treasury / verifier signer: `35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr`
- dUSDC mint (USDC stand-in, 6 decimals): `75ENcpvcrtpXbzpJgjibHBW55hxPTKbABnstNuXyzJqL`

You can also try it yourself: connect Phantom or Solflare on the pad page, claim 100
free test dUSDC from the built-in faucet, and donate.

## How it works

1. A hub opens a pad and splits its budget into milestones, each with a proof
   requirement.
2. Donors back specific milestones in SOL or dUSDC. The money lands in the pad vault.
3. An independent verifier submits proof of delivery. Its SHA-256 hash is recorded.
4. The vault releases the tranche to the beneficiary, tagged on-chain with the proof
   it was cleared against. The whole path shows up on the pad's Trace timeline.

## Tech

- **Next.js 16** (App Router, React 19), **Tailwind v4**, **framer-motion** for the
  choreography.
- **@solana/web3.js** and **wallet-adapter** (Phantom, Solflare) for the donor flow.
- **@solana/spl-token** for the dUSDC mint, vaults, and transfers.
- **Neon serverless Postgres** as the index for accounts, hubs, pads, milestones,
  donations, and attestations.
- **Groq** for the plain-language ledger that turns raw on-chain data into a readable
  account of where a donation went.
- **Vercel** for hosting.

Every part of the app that needs to persist state is wired to Neon: registration and
login, donations, proofs, releases, and per-account history.

## Running locally

```bash
npm install
cp .env.example .env.local          # fill in the values
node scripts/bootstrap-devnet.mjs   # one-time: fund treasury, create the dUSDC mint
node scripts/migrate.mjs            # create tables, seed content and the admin account
npm run dev
```

Required environment variables are documented in [`.env.example`](.env.example). Real
secrets live only in `.env.local`, which is gitignored.

## Repository layout

```
src/app            routes: landing, explore, pad, console, dashboard, auth, api
src/lib            solana, neon data layer, auth, groq, config
src/components     ui, motion, flow demo, donate panel, console
scripts            devnet bootstrap, migration, end-to-end proof
docs               the mega-prompt build plan
```

## Roadmap beyond the MVP

- Move vaults to a PDA-owned Anchor program so release rules are enforced on-chain
  rather than by a server signer.
- Verifier staking and slashing, so attestations carry economic weight.
- Fiat off-ramp receipts pulled in through a partner so the last mile is machine
  readable.
- Recurring giving and richer donor dashboards.

## Team

- **Christian Alexander Wongso** — idea and concept owner.
- **Vincentius Bryan Kwandou** — PIC, Superteam Campus Club, Universitas Atma Jaya
  Makassar. Facilitated turning the concept into a working product.

---

Built for the Solana devnet. dUSDC is a devnet test asset with no monetary value.
