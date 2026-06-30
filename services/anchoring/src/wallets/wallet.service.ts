import { randomUUID } from 'crypto';
import type { CustodialWallet, StoredWallet, WalletProvider } from './wallet.types';
import type { WalletRepository } from './wallet.repository';

export interface WalletCreationResult {
  wallet: CustodialWallet;
  created: boolean;
}

// Build the public view explicitly so the custody key handle can never leak through
// (e.g. via object spread). Only these fields ever cross the service boundary.
function toPublicView(stored: StoredWallet): CustodialWallet {
  return {
    id: stored.id,
    ownerRef: stored.ownerRef,
    address: stored.address,
    provider: stored.provider,
    createdAt: stored.createdAt
  };
}

export class WalletService {
  constructor(
    private readonly repository: WalletRepository,
    private readonly provider: WalletProvider
  ) {}

  // Transparently returns the owner's custodial wallet, creating it on first call.
  // Idempotent — the user never has to know a wallet exists or manage keys
  // ("用户无感知创建").
  async getOrCreate(ownerRef: string): Promise<WalletCreationResult> {
    const existing = await this.repository.findByOwner(ownerRef);
    if (existing) {
      return { wallet: toPublicView(existing), created: false };
    }

    const provisioned = await this.provider.provision(ownerRef);
    const stored: StoredWallet = {
      id: randomUUID(),
      ownerRef,
      address: provisioned.address,
      keyReference: provisioned.keyReference,
      provider: this.provider.name,
      createdAt: new Date().toISOString()
    };
    const saved = await this.repository.save(stored);
    return { wallet: toPublicView(saved), created: true };
  }

  async findByOwner(ownerRef: string): Promise<CustodialWallet | null> {
    const stored = await this.repository.findByOwner(ownerRef);
    return stored ? toPublicView(stored) : null;
  }
}
