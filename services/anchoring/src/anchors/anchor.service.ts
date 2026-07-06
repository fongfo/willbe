import { randomUUID } from 'crypto';
import type { AnchorRepository } from './anchor.repository';
import type { ProofOfPlanGateway } from './proof-gateway';
import type { AnchorPlanInput, AnchorRecord } from './anchor.types';
import { buildPlanCommitment, buildPlanRef } from './plan-hash';

export class AnchorService {
  constructor(
    private readonly repository: AnchorRepository,
    private readonly gateway: ProofOfPlanGateway
  ) {}

  async anchorPlan(input: AnchorPlanInput): Promise<AnchorRecord> {
    const commitment = buildPlanCommitment(input.snapshot);
    const planRef = buildPlanRef(input.ownerRef);
    const receipt = await this.gateway.anchorProof(planRef, commitment.planHash);
    const now = new Date().toISOString();

    const record: AnchorRecord = {
      id: randomUUID(),
      ownerRef: input.ownerRef,
      planRef,
      ...commitment,
      ...receipt,
      status: 'ANCHORED',
      createdAt: now
    };

    return this.repository.save(record);
  }

  async findLatestByOwner(ownerRef: string): Promise<AnchorRecord | null> {
    return this.repository.findLatestByOwner(ownerRef);
  }
}

