import type { TrustedContactModel as TrustedContact } from '../generated/prisma/models';
import type { AssetReferenceModel as AssetReference } from '../generated/prisma/models';
import { buildHandover } from './handover.builder';
import type { HandoverView } from './handover.types';

// Minimal surface the service needs from each domain repository, so it can be unit
// tested with plain mocks and stays decoupled from the concrete repository classes.
export interface HandoverRepositories {
  trustedContacts: { findAll(userId: string): Promise<TrustedContact[]> };
  assetReferences: { findAll(userId: string): Promise<AssetReference[]> };
}

export class HandoverService {
  constructor(private readonly repositories: HandoverRepositories) {}

  async preview(userId: string): Promise<HandoverView> {
    const [contacts, assets] = await Promise.all([
      this.repositories.trustedContacts.findAll(userId),
      this.repositories.assetReferences.findAll(userId)
    ]);

    return buildHandover(contacts, assets);
  }
}
