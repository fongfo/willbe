import { prisma } from '../db/client';

export interface PlanProgressCounts {
  familyMembers: number;
  trustedContacts: number;
  assetReferences: number;
  reviewSettings: number;
}

export class PlanProgressRepository {
  async countSetupInputs(userId: string): Promise<PlanProgressCounts> {
    const [
      familyMembers,
      trustedContacts,
      assetReferences,
      reviewSettings
    ] = await prisma.$transaction([
      prisma.familyMember.count({ where: { userId } }),
      prisma.trustedContact.count({ where: { userId } }),
      prisma.assetReference.count({ where: { userId } }),
      prisma.reviewSetting.count({ where: { userId } })
    ]);

    return {
      familyMembers,
      trustedContacts,
      assetReferences,
      reviewSettings
    };
  }
}
