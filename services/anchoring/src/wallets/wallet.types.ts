// Supported custodial wallet providers. Only an in-memory mock exists today; real
// custodians (KMS/MPC) are added here as the anchoring Epic progresses.
export type WalletProviderName = 'MOCK';

// Public-facing custodial wallet. Safe to return over the API — it carries no secret
// key material, only the public chain address.
export interface CustodialWallet {
  id: string;
  ownerRef: string;
  address: string;
  provider: WalletProviderName;
  createdAt: string;
}

// Internal record. Holds the opaque custody key handle and never leaves the service.
export interface StoredWallet extends CustodialWallet {
  keyReference: string;
}

// What a provider returns when it provisions custody key material for an owner.
export interface ProvisionedWallet {
  address: string;
  keyReference: string;
}

// Abstraction over a custodial wallet provider. The mock implementation backs
// development and tests; a real custodian swaps in behind this interface without
// touching the service or routes.
export interface WalletProvider {
  readonly name: WalletProviderName;
  provision(ownerRef: string): Promise<ProvisionedWallet>;
}
