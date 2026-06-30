import type { StoredWallet } from './wallet.types';

// Persistence boundary for custodial wallets. Keyed by ownerRef so that creation is
// idempotent — one wallet per owner.
export interface WalletRepository {
  findByOwner(ownerRef: string): Promise<StoredWallet | null>;
  save(wallet: StoredWallet): Promise<StoredWallet>;
}

// In-memory store for the MVP scaffold. Custody is not yet persisted to a datastore;
// this is swapped for a durable repository as the anchoring Epic gains persistence.
export class InMemoryWalletRepository implements WalletRepository {
  private readonly wallets = new Map<string, StoredWallet>();

  async findByOwner(ownerRef: string): Promise<StoredWallet | null> {
    return this.wallets.get(ownerRef) ?? null;
  }

  async save(wallet: StoredWallet): Promise<StoredWallet> {
    this.wallets.set(wallet.ownerRef, wallet);
    return wallet;
  }
}
