import type { PlanProgress } from './plan-progress.schema';
import type { PlanProgressCounts } from './plan-progress.repository';

export interface PlanProgressRepositoryLike {
  countSetupInputs(userId: string): Promise<PlanProgressCounts>;
}

export class PlanProgressService {
  constructor(private readonly repository: PlanProgressRepositoryLike) {}

  async get(userId: string): Promise<PlanProgress> {
    const counts = await this.repository.countSetupInputs(userId);
    const hasFamilyMembers = counts.familyMembers > 0;
    const hasTrustedContacts = counts.trustedContacts > 0;
    const hasAssetReferences = counts.assetReferences > 0;
    const hasCheckInSetup = counts.reviewSettings > 0;
    const completedSetupSteps = [
      hasFamilyMembers,
      hasTrustedContacts,
      hasAssetReferences,
      hasCheckInSetup
    ].filter(Boolean).length;

    return {
      completedSetupSteps,
      hasFamilyMembers,
      hasTrustedContacts,
      hasAssetReferences,
      hasCheckInSetup
    };
  }
}
