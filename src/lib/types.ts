export type Asset = "SOL" | "USDC";

export type MilestoneStatus = "locked" | "proven" | "released" | "refundable";
export type PadStatus = "open" | "funded" | "delivering" | "closed";

export interface Hub {
  id: string;
  name: string;
  steward: string; // wallet that runs the hub
  blurb: string;
  createdAt: string;
}

export interface Pad {
  id: string;
  hubId: string;
  title: string;
  summary: string;
  category: string;
  location: string;
  vault: string; // pad vault pubkey (SOL) / owner of the USDC ATA
  asset: Asset;
  goal: number; // in whole units (SOL or USDC)
  raised: number;
  beneficiary: string; // where released funds land
  status: PadStatus;
  visibility: "public" | "unlisted";
  reviewStatus: "approved" | "flagged" | "blocked";
  createdAt: string;
}

export interface Milestone {
  id: string;
  padId: string;
  idx: number;
  title: string;
  detail: string;
  amount: number;
  status: MilestoneStatus;
  deadline: string;
  proofHash?: string;
  attestationId?: string;
  releaseSig?: string;
}

export interface Donation {
  id: string;
  padId: string;
  donor: string;
  asset: Asset;
  amount: number;
  sig: string;
  createdAt: string;
}

export interface Attestation {
  id: string;
  milestoneId: string;
  verifier: string;
  proofHash: string;
  note: string;
  createdAt: string;
}

export interface PadDetail extends Pad {
  hub: Hub;
  milestones: Milestone[];
  donations: Donation[];
  attestations: Attestation[];
}
