import { createHash } from 'crypto';
import type { ProvisionedWallet, WalletProvider, WalletProviderName } from './wallet.types';

// Deterministic, in-memory custodial wallet provider for development and tests.
// It derives an EVM-style address from a hash of the owner reference — no real keys,
// no chain calls, no funds. A real custodian (KMS/MPC) replaces this behind the
// WalletProvider interface before any testnet/mainnet use.
export class MockWalletProvider implements WalletProvider {
  readonly name: WalletProviderName = 'MOCK';

  async provision(ownerRef: string): Promise<ProvisionedWallet> {
    const digest = createHash('sha256').update(ownerRef).digest('hex');
    // First 20 bytes form an EVM-style 0x address.
    const address = `0x${digest.slice(0, 40)}`;
    // Opaque handle a real custodian would return (e.g. a KMS key id). This is a mock
    // value only — never a usable secret, and never exposed over the API.
    const keyReference = `mock-key-${digest.slice(40)}`;
    return { address, keyReference };
  }
}
