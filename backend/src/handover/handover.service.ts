import type { TrustedContactModel as TrustedContact } from '../generated/prisma/models';
import type { AssetReferenceModel as AssetReference } from '../generated/prisma/models';
import { buildHandover } from './handover.builder';
import type { HandoverView } from './handover.types';

// Minimal surface the service needs from each domain repository, so it can be unit
// tested with plain mocks and stays decoupled from the concrete repository classes.
export interface HandoverRepositories {
  trustedContacts: { findAll(): Promise<TrustedContact[]> };
  assetReferences: { findAll(): Promise<AssetReference[]> };
}

export class HandoverService {
  constructor(private readonly repositories: HandoverRepositories) {}

  async preview(): Promise<HandoverView> {
    const [contacts, assets] = await Promise.all([
      this.repositories.trustedContacts.findAll(),
      this.repositories.assetReferences.findAll()
    ]);

    return buildHandover(contacts, assets);
  }
}
