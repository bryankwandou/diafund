export const metadata = { title: "Privacy — Diafund" };

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy agreement</h1>
      <p className="mt-2 text-sm text-faint">How your account information is handled.</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <p>
          We store the details you give us at sign up: a username, an email address, and
          a password. The password is never kept in plain text; it is salted and hashed
          before it touches the database.
        </p>
        <p>
          We record the donations and proofs tied to your account so we can show you your
          own history. Transactions themselves live on a public blockchain and are
          visible to anyone, by design. That is the whole point of the product.
        </p>
        <p>
          We do not sell your information, and we do not share your email with third
          parties for marketing. We use it only to run your account and to reach you about
          it if we need to.
        </p>
        <p>
          You can ask us to delete your account and the personal details attached to it.
          On-chain records cannot be erased, but they are not tied to your email or
          password in the ledger.
        </p>
      </div>
    </div>
  );
}
