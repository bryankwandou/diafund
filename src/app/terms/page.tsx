export const metadata = { title: "Terms — Diafund" };

export default function Terms() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Terms and conditions</h1>
      <p className="mt-2 text-sm text-faint">Last updated for the devnet preview.</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <p>
          Diafund is a preview running on the Solana devnet. The tokens moved here,
          including the dUSDC test asset, carry no monetary value. Nothing on this site
          is a solicitation for real donations.
        </p>
        <p>
          When you create an account you agree to use it honestly. Do not attempt to
          impersonate a hub, submit false proofs of delivery, or interfere with other
          people using the service.
        </p>
        <p>
          Operators who register hubs and pads are responsible for the accuracy of what
          they publish. Proof of delivery is signed by verifiers, and those signatures
          are recorded on-chain. You are accountable for what you sign.
        </p>
        <p>
          The service is provided as is while it is in preview. Features may change, and
          data seeded for demonstration may be reset. We will give notice before any
          change that would affect a live account.
        </p>
      </div>
    </div>
  );
}
