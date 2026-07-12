import "server-only";
import Groq from "groq-sdk";
import type { PadDetail } from "./types";

// Turns the raw pad record into a short, readable account a donor can understand
// without knowing anything about blockchains. Falls back to a plain summary when no
// key is set so the app never depends on the model being reachable.
export async function ledgerSummary(pad: PadDetail): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  const released = pad.milestones.filter((m) => m.status === "released");
  const proven = pad.milestones.filter((m) => m.status === "proven");

  if (!key) {
    return `${pad.title}: raised ${pad.raised} of ${pad.goal} ${pad.asset}. ` +
      `${released.length} of ${pad.milestones.length} milestones released, ` +
      `${proven.length} awaiting release.`;
  }

  const facts = {
    title: pad.title,
    location: pad.location,
    asset: pad.asset,
    goal: pad.goal,
    raised: pad.raised,
    donationCount: pad.donations.length,
    milestones: pad.milestones.map((m) => ({
      title: m.title,
      amount: m.amount,
      status: m.status,
      hasProof: Boolean(m.proofHash),
    })),
  };

  const groq = new Groq({ apiKey: key });
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    max_tokens: 220,
    messages: [
      {
        role: "system",
        content:
          "You write short status notes for donors about a funded project. Use plain, " +
          "concrete language. Three or four sentences. State what has been funded, what " +
          "has been proven and paid out, and what is still pending. No marketing tone, " +
          "no emoji, no headings, no bullet points.",
      },
      { role: "user", content: JSON.stringify(facts) },
    ],
  });
  return (
    res.choices[0]?.message?.content?.trim() ||
    `${pad.title}: raised ${pad.raised} of ${pad.goal} ${pad.asset}.`
  );
}
