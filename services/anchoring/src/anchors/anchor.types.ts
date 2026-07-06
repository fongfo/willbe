export type AnchorStatus = 'ANCHORED';

export interface AnchorPlanInput {
  ownerRef: string;
  snapshot: Record<string, unknown>;
}

export interface PlanCommitment {
  merkleRoot: string;
  planHash: string;
  leafCount: number;
}

export interface ChainAnchorReceipt {
  version: number;
  anchoredAt: string;
  transactionHash: string;
  network: string;
  contractAddress: string;
}

export interface AnchorRecord extends PlanCommitment, ChainAnchorReceipt {
  id: string;
  ownerRef: string;
  planRef: string;
  status: AnchorStatus;
  createdAt: string;
}

