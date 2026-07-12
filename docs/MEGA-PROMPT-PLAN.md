# Diafund — Mega Prompt & Build Plan

> Working blueprint for the build. This is the internal planning document requested
> before execution. Human-facing copy lives in the app and README; this file is for
> the team.

## 1. One-liner

Diafund keeps every donation locked in an on-chain vault and releases it in stages,
one milestone at a time, only after an independent verifier signs off on proof that
the money reached the people it was meant for.

## 2. Why this is not another "charity on the blockchain" project

Most donation-transparency tools stop at showing that money moved from wallet A to
wallet B. That proves custody changed hands. It does not prove a well was dug, a
student paid their fees, or a family received food. The trust actually breaks at the
last mile, where crypto turns into cash and cash turns into goods, and that stretch
is invisible on a plain block explorer.

Diafund closes that gap with three moves:

1. **Staged escrow.** A donor funds milestones, not an organization. Money sits in a
   pad vault and unlocks tranche by tranche. A bad actor cannot drain the whole
   amount up front.
2. **Independent proof of delivery.** Each release is gated by an attestation signed
   by a verifier who is not the recipient. The proof document (receipt, photo, GPS
   point) is hashed, and the hash is written on-chain, so the record cannot be
   quietly rewritten later.
3. **Deadline refunds.** If a milestone is never proven, the remaining balance is
   marked refundable to the original donors. Giving becomes a conditional promise,
   not a leap of faith.

The donor-facing payoff: you can follow your own contribution all the way to the
proof of what it bought, not just to the first hop.

## 3. Product vocabulary

- **Hub** — an operator or foundation that stewards causes. Registered in the
  operator console.
- **Pad** — a single campaign vault under a hub. Donations land on a pad.
- **Milestone** — a tranche of a pad's budget, with an amount and a required proof.
- **Attestation** — a verifier-signed proof of delivery. Its file hash is anchored
  on-chain.
- **Trace** — the public timeline a donor reads to see where the money went.

## 4. On-chain design (Solana devnet)

MVP runs entirely on Solana devnet with real transactions that anyone can open on
Solscan.

- **Assets.** Native SOL, plus a devnet SPL mint that stands in for USDC (6
  decimals), exposed in the UI as the "USDC (devnet)" option.
- **Vaults.** Each pad has its own vault address. Devnet demo custody is held by a
  server signer so releases can be automated for the judges; the roadmap swaps this
  for a PDA-owned vault in the Anchor program (see section 8).
- **Donation.** Donor wallet signs a transfer into the pad vault, tagged with a memo
  `diafund:donate:<padId>`. Real devnet transaction, real signature.
- **Release.** The verifier signer moves funds from the vault to the beneficiary,
  tagged `diafund:release:<padId>:<milestoneId>:<proofHash>`. Real devnet
  transaction, gated by an attestation record.
- **Proof anchoring.** The SHA-256 of the uploaded proof is embedded in the release
  memo, so the explorer itself carries the fingerprint of the evidence.

Every hop is indexed off-chain with its signature and a Solscan link, and rendered on
the Trace timeline.

## 5. Stack

- Next.js 14 (app router), TypeScript, Tailwind, shadcn-style components.
- Solana web3.js + wallet adapter (Phantom, Solflare) for the donor flow.
- Neon serverless Postgres as the index of hubs, pads, milestones, donations, and
  attestations.
- Groq for the plain-language ledger: it turns raw on-chain and proof data into a
  short, readable account of what a donation did.
- Framer Motion for entrance choreography and interaction feedback.
- Vercel for hosting.

## 6. Pages

- `/` Landing. The pitch, the trust model, a live devnet proof widget, animated.
- `/explore` Browse hubs and pads.
- `/pad/[id]` Pad detail: budget, milestones, the Trace timeline, donate panel.
- `/donate/[id]` Focused donate flow (SOL or devnet USDC).
- `/console` Operator console: register a hub, open a pad, define milestones, submit
  an attestation, trigger a release.
- `/trace/[sig]` Deep link to a single on-chain step.

## 7. Data model (Neon)

- `hubs` (id, name, steward_wallet, blurb, created_at)
- `pads` (id, hub_id, title, summary, vault_pubkey, asset, goal, raised, status)
- `milestones` (id, pad_id, idx, title, amount, status, deadline, proof_hash,
  release_sig)
- `donations` (id, pad_id, donor_wallet, asset, amount, sig, created_at)
- `attestations` (id, milestone_id, verifier_wallet, proof_hash, note, created_at)

## 8. Roadmap past the MVP

- Anchor program with PDA-owned vaults so release rules are enforced on-chain, not by
  a server signer.
- Verifier staking and slashing, so attestations carry economic weight.
- Fiat off-ramp receipts pulled in through a partner so the last mile is machine
  readable.
- Recurring giving and donor dashboards.

## 9. Execution order

1. Env and secrets wired, all gitignored.
2. Solana lib: mint bootstrap, vault helpers, donate and release builders.
3. Neon schema and API routes.
4. Operator console and donate flow.
5. Landing page and Trace timeline with motion.
6. Groq ledger summaries.
7. README with the full submission administration.
8. GitHub repo and Vercel deploy, then a devnet proof run.
