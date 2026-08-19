import type { TrustedContactModel as TrustedContact } from '../generated/prisma/models';
import type { AssetReferenceModel as AssetReference } from '../generated/prisma/models';
import type { FamilyMemberModel as FamilyMember } from '../generated/prisma/models';
import type { HandoverInstructionView } from './handover.types';
import { buildHandover } from './handover.builder';
import type { HandoverView } from './handover.types';

// Minimal surface the service needs from each domain repository, so it can be unit
// tested with plain mocks and stays decoupled from the concrete repository classes.
export interface HandoverRepositories {
  familyMembers: { findAll(userId: string): Promise<FamilyMember[]> };
  trustedContacts: { findAll(userId: string): Promise<TrustedContact[]> };
  assetReferences: { findAll(userId: string): Promise<AssetReference[]> };
  handoverInstructions: { get(userId: string): Promise<HandoverInstructionView | null> };
}

interface HandoverPreviewOptions {
  mode?: 'owner' | 'contact';
}

export class HandoverService {
  constructor(private readonly repositories: HandoverRepositories) {}

  async preview(userId: string, options: HandoverPreviewOptions = {}): Promise<HandoverView> {
    const [contacts, familyMembers, assets, instruction] = await Promise.all([
      this.repositories.trustedContacts.findAll(userId),
      this.repositories.familyMembers.findAll(userId),
      this.repositories.assetReferences.findAll(userId),
      this.repositories.handoverInstructions.get(userId)
    ]);

    return buildHandover(contacts, familyMembers, assets, instruction, {
      contactVisibility: options.mode === 'contact' ? 'verified' : 'all',
      familyDetailMode: options.mode === 'contact' ? 'omit' : 'include'
    });
  }
}
