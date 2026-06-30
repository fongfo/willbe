import { WalletService } from '../../src/wallets/wallet.service';
import { InMemoryWalletRepository } from '../../src/wallets/wallet.repository';
import type { ProvisionedWallet, WalletProvider } from '../../src/wallets/wallet.types';

class StubProvider implements WalletProvider {
  readonly name = 'MOCK' as const;
  public calls = 0;

  async provision(ownerRef: string): Promise<ProvisionedWallet> {
    this.calls += 1;
    return { address: `0xaddress-${ownerRef}`, keyReference: `secret-${ownerRef}` };
  }
}

describe('WalletService', () => {
  let repository: InMemoryWalletRepository;
  let provider: StubProvider;
  let service: WalletService;

  beforeEach(() => {
    repository = new InMemoryWalletRepository();
    provider = new StubProvider();
    service = new WalletService(repository, provider);
  });

  it('creates a wallet transparently on first request', async () => {
    const result = await service.getOrCreate('plan-1');

    expect(result.created).toBe(true);
    expect(result.wallet.ownerRef).toBe('plan-1');
    expect(result.wallet.address).toBe('0xaddress-plan-1');
    expect(result.wallet.provider).toBe('MOCK');
    expect(result.wallet.id).toBeDefined();
    expect(provider.calls).toBe(1);
  });

  it('is idempotent — a second call returns the existing wallet without re-provisioning', async () => {
    const first = await service.getOrCreate('plan-1');
    const second = await service.getOrCreate('plan-1');

    expect(second.created).toBe(false);
    expect(second.wallet.id).toBe(first.wallet.id);
    expect(second.wallet.address).toBe(first.wallet.address);
    expect(provider.calls).toBe(1);
  });

  it('never exposes the custody key handle in the public wallet', async () => {
    const result = await service.getOrCreate('plan-1');

    expect(result.wallet).not.toHaveProperty('keyReference');
    expect(JSON.stringify(result.wallet)).not.toContain('secret-plan-1');
  });

  it('returns null for an owner with no wallet, and the wallet once created', async () => {
    expect(await service.findByOwner('missing')).toBeNull();

    await service.getOrCreate('plan-1');
    const found = await service.findByOwner('plan-1');

    expect(found?.ownerRef).toBe('plan-1');
    expect(found).not.toHaveProperty('keyReference');
  });
});
