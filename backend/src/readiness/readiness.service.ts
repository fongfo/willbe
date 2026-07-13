import type { FamilyMemberModel as FamilyMember } from '../generated/prisma/models';
import type { TrustedContactModel as TrustedContact } from '../generated/prisma/models';
import type { AssetReferenceModel as AssetReference } from '../generated/prisma/models';
import type { ReviewSettingModel as ReviewSetting } from '../generated/prisma/models';
import { computeReadiness } from './readiness.engine';
import type { ReadinessAssessment, ReadinessInput } from './readiness.types';

// Keyword heuristics carried over from the prototype. The data model has no explicit
// "advisor" role or "beneficiary" flag, so we match the free-text fields the user can
// fill in (contact name/detail, asset detail).
const ADVISOR_PATTERN = /advisor|lawyer|planner/i;
const BENEFICIARY_PATTERN = /beneficiary/i;

// Minimal surface the service needs from each domain repository, so it can be unit
// tested with plain mocks and stays decoupled from the concrete repository classes.
export interface ReadinessRepositories {
  familyMembers: { findAll(userId: string): Promise<FamilyMember[]> };
  trustedContacts: { findAll(userId: string): Promise<TrustedContact[]> };
  assetReferences: { findAll(userId: string): Promise<AssetReference[]> };
  reviewSetting: { get(userId: string): Promise<ReviewSetting | null> };
}

export class ReadinessService {
  constructor(private readonly repositories: ReadinessRepositories) {}

  async assess(userId: string): Promise<ReadinessAssessment> {
    const [familyMembers, contacts, assets, reviewSetting] = await Promise.all([
      this.repositories.familyMembers.findAll(userId),
      this.repositories.trustedContacts.findAll(userId),
      this.repositories.assetReferences.findAll(userId),
      this.repositories.reviewSetting.get(userId)
    ]);

    const input: ReadinessInput = {
      familyMemberCount: familyMembers.length,
      contactCount: contacts.length,
      assetCount: assets.length,
      hasAdvisorContact: contacts.some((contact) =>
        ADVISOR_PATTERN.test(`${contact.name} ${contact.detail ?? ''}`)
      ),
      hasBeneficiaryNote: assets.some((asset) => BENEFICIARY_PATTERN.test(asset.detail ?? '')),
      connectedProviderCount: reviewSetting?.connectedProviders.length ?? 0,
      checkInFrequency: reviewSetting?.checkInFrequency ?? null
    };

    return computeReadiness(input);
  }
}
