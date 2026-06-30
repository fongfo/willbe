import { MockWalletProvider } from '../../src/wallets/wallet.provider';

describe('MockWalletProvider', () => {
  const provider = new MockWalletProvider();

  it('identifies itself as the MOCK provider', () => {
    expect(provider.name).toBe('MOCK');
  });

  it('provisions an EVM-style address and an opaque key reference', async () => {
    const result = await provider.provision('plan-1');

    expect(result.address).toMatch(/^0x[0-9a-f]{40}$/);
    expect(result.keyReference).toMatch(/^mock-key-/);
  });

  it('is deterministic for the same owner reference', async () => {
    const a = await provider.provision('plan-1');
    const b = await provider.provision('plan-1');

    expect(a.address).toBe(b.address);
    expect(a.keyReference).toBe(b.keyReference);
  });

  it('produces different addresses for different owners', async () => {
    const a = await provider.provision('plan-1');
    const b = await provider.provision('plan-2');

    expect(a.address).not.toBe(b.address);
  });
});
