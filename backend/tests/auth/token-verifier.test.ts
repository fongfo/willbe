import { DevTokenVerifier } from '../../src/auth/token-verifier';

describe('DevTokenVerifier', () => {
  it('maps a local embedded-wallet token to a verified identity', async () => {
    const verifier = new DevTokenVerifier();

    const result = await verifier.verify('dev:aisyah.rahman%40gmail.com:Aisyah%20Rahman');

    expect(result.privyUserId).toBe('dev:aisyah.rahman@gmail.com');
    expect(result.email).toBe('aisyah.rahman@gmail.com');
    expect(result.name).toBe('Aisyah Rahman');
    expect(result.walletAddress).toMatch(/^0x[a-f0-9]{40}$/);
  });

  it('rejects malformed tokens', async () => {
    const verifier = new DevTokenVerifier();

    await expect(verifier.verify('not-a-token')).rejects.toThrow('Invalid access token');
  });

  it('refuses dev tokens when local auth is disabled', async () => {
    const verifier = new DevTokenVerifier(false);

    await expect(verifier.verify('dev:aisyah.rahman%40gmail.com')).rejects.toThrow(
      'Privy token verifier is not configured'
    );
  });
});
