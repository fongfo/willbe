import { DevTokenVerifier, PrivyTokenVerifier } from '../../src/auth/token-verifier';

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

  it('accepts local tokens without a display name', async () => {
    const verifier = new DevTokenVerifier();

    const result = await verifier.verify('dev:aisyah.rahman%40gmail.com');

    expect(result).toMatchObject({
      privyUserId: 'dev:aisyah.rahman@gmail.com',
      email: 'aisyah.rahman@gmail.com'
    });
    expect(result.name).toBeUndefined();
  });

  it('rejects local tokens with invalid emails', async () => {
    const verifier = new DevTokenVerifier();

    await expect(verifier.verify('dev:not-an-email')).rejects.toThrow(
      'Email must be valid'
    );
  });

  it('refuses dev tokens when local auth is disabled', async () => {
    const verifier = new DevTokenVerifier(false);

    await expect(verifier.verify('dev:aisyah.rahman%40gmail.com')).rejects.toThrow(
      'Privy token verifier is not configured'
    );
  });
});

describe('PrivyTokenVerifier', () => {
  const authClient = {
    verifyAccessToken: jest.fn(),
    verifyIdentityToken: jest.fn(),
    getUser: jest.fn()
  };

  beforeEach(() => {
    authClient.verifyAccessToken.mockResolvedValue({
      user_id: 'did:privy:user-1'
    });
    authClient.verifyIdentityToken.mockResolvedValue({
      id: 'did:privy:user-1',
      linkedAccounts: [
        {
          type: 'email',
          address: 'aisyah.rahman@gmail.com',
          name: 'Aisyah Rahman'
        },
        {
          type: 'wallet',
          chain_type: 'ethereum',
          address: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
        }
      ]
    });
    authClient.getUser.mockResolvedValue({
      id: 'did:privy:user-1',
      linked_accounts: []
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('maps Privy access and identity tokens to a verified identity', async () => {
    const verifier = new PrivyTokenVerifier(authClient);

    const result = await verifier.verify('privy-access-token', 'privy-id-token');

    expect(authClient.verifyAccessToken).toHaveBeenCalledWith('privy-access-token');
    expect(authClient.verifyIdentityToken).toHaveBeenCalledWith('privy-id-token');
    expect(authClient.getUser).not.toHaveBeenCalled();
    expect(result).toEqual({
      privyUserId: 'did:privy:user-1',
      email: 'aisyah.rahman@gmail.com',
      name: 'Aisyah Rahman',
      walletAddress: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
    });
  });

  it('accepts a valid access token when no full user lookup is available', async () => {
    const verifier = new PrivyTokenVerifier({
      verifyAccessToken: authClient.verifyAccessToken,
      verifyIdentityToken: authClient.verifyIdentityToken
    });

    const result = await verifier.verify('privy-access-token');

    expect(result).toEqual({
      privyUserId: 'did:privy:user-1'
    });
    expect(authClient.verifyIdentityToken).not.toHaveBeenCalled();
    expect(authClient.getUser).not.toHaveBeenCalled();
  });

  it('falls back to the full Privy user when no identity token is supplied', async () => {
    authClient.getUser.mockResolvedValue({
      id: 'did:privy:user-1',
      linked_accounts: [
        {
          type: 'email',
          address: 'imran@example.com'
        }
      ]
    });
    const verifier = new PrivyTokenVerifier(authClient);

    const result = await verifier.verify('privy-access-token');

    expect(authClient.verifyIdentityToken).not.toHaveBeenCalled();
    expect(authClient.getUser).toHaveBeenCalledWith('did:privy:user-1');
    expect(result).toMatchObject({
      privyUserId: 'did:privy:user-1',
      email: 'imran@example.com'
    });
  });

  it('falls back to the full Privy user when the identity token omits email', async () => {
    authClient.verifyIdentityToken.mockResolvedValue({
      id: 'did:privy:user-1',
      linked_accounts: []
    });
    authClient.getUser.mockResolvedValue({
      id: 'did:privy:user-1',
      linked_accounts: [
        {
          type: 'email',
          address: 'imran@example.com',
          name: 'Imran Rahman'
        }
      ]
    });
    const verifier = new PrivyTokenVerifier(authClient);

    const result = await verifier.verify('privy-access-token', 'privy-id-token');

    expect(authClient.getUser).toHaveBeenCalledWith('did:privy:user-1');
    expect(result).toMatchObject({
      privyUserId: 'did:privy:user-1',
      email: 'imran@example.com',
      name: 'Imran Rahman'
    });
  });

  it('rejects mismatched Privy identity tokens', async () => {
    authClient.verifyIdentityToken.mockResolvedValue({
      id: 'did:privy:other-user',
      linkedAccounts: []
    });
    const verifier = new PrivyTokenVerifier(authClient);

    await expect(verifier.verify('privy-access-token', 'privy-id-token')).rejects.toThrow(
      'Privy identity token does not match access token'
    );
  });

  it('uses Privy sub claims and snake_case linked account metadata', async () => {
    authClient.verifyAccessToken.mockResolvedValue({
      sub: 'did:privy:user-1'
    });
    authClient.verifyIdentityToken.mockResolvedValue({
      userId: 'did:privy:user-1',
      linked_accounts: [
        {
          type: 'email',
          email: 'aisyah.rahman@gmail.com'
        },
        {
          type: 'wallet',
          chainType: 'ethereum',
          address: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
        }
      ]
    });
    const verifier = new PrivyTokenVerifier(authClient);

    const result = await verifier.verify('privy-access-token', 'privy-id-token');

    expect(result).toMatchObject({
      privyUserId: 'did:privy:user-1',
      email: 'aisyah.rahman@gmail.com',
      walletAddress: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
    });
  });

  it('rejects access tokens without a Privy user id', async () => {
    authClient.verifyAccessToken.mockResolvedValue({});
    const verifier = new PrivyTokenVerifier(authClient);

    await expect(verifier.verify('privy-access-token')).rejects.toThrow(
      'Invalid access token'
    );
  });

  it('rejects identity tokens with a mismatched userId', async () => {
    authClient.verifyIdentityToken.mockResolvedValue({
      userId: 'did:privy:other-user',
      linkedAccounts: []
    });
    const verifier = new PrivyTokenVerifier(authClient);

    await expect(verifier.verify('privy-access-token', 'privy-id-token')).rejects.toThrow(
      'Privy identity token does not match access token'
    );
  });

  it('rejects malformed wallet addresses from identity tokens', async () => {
    authClient.verifyIdentityToken.mockResolvedValue({
      id: 'did:privy:user-1',
      linkedAccounts: [
        {
          type: 'wallet',
          chain_type: 'ethereum',
          address: 'not-a-wallet'
        }
      ]
    });
    const verifier = new PrivyTokenVerifier(authClient);

    await expect(verifier.verify('privy-access-token', 'privy-id-token')).rejects.toThrow(
      'Wallet address must be a valid EVM address'
    );
  });

  it('rejects invalid Privy access tokens', async () => {
    authClient.verifyAccessToken.mockRejectedValue(new Error('bad token'));
    const verifier = new PrivyTokenVerifier(authClient);

    await expect(verifier.verify('bad-token')).rejects.toThrow('Invalid access token');
  });
});
