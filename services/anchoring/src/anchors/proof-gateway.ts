import { createHash } from 'crypto';
import type { ChainAnchorReceipt } from './anchor.types';

export interface ProofOfPlanGateway {
  anchorProof(planRef: string, planHash: string): Promise<ChainAnchorReceipt>;
}

interface MockProofOfPlanGatewayOptions {
  contractAddress?: string;
  network?: string;
}

function hashTransaction(planRef: string, planHash: string, version: number): string {
  const input = `${planRef}:${planHash}:${version}`;
  return `0x${createHash('sha256').update(input).digest('hex')}`;
}

export class MockProofOfPlanGateway implements ProofOfPlanGateway {
  private readonly versions = new Map<string, number>();
  private readonly contractAddress: string;
  private readonly network: string;

  constructor(options: MockProofOfPlanGatewayOptions = {}) {
    this.contractAddress =
      options.contractAddress ?? '0x0000000000000000000000000000000000000000';
    this.network = options.network ?? 'polygon-amoy';
  }

  async anchorProof(planRef: string, planHash: string): Promise<ChainAnchorReceipt> {
    const version = (this.versions.get(planRef) ?? 0) + 1;
    this.versions.set(planRef, version);

    return {
      version,
      anchoredAt: new Date().toISOString(),
      transactionHash: hashTransaction(planRef, planHash, version),
      network: this.network,
      contractAddress: this.contractAddress
    };
  }
}

