import { createPrivyAccountSession } from '../src/account/auth.api';
import { apiClient } from '../src/api/client';

jest.mock('../src/api/client', () => ({
  apiClient: {
    postWithHeaders: jest.fn()
  }
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('account auth api', () => {
  beforeEach(() => {
    mockedApiClient.postWithHeaders.mockResolvedValue({
      user: {
        id: 'user-1',
        privyUserId: 'dev:aisyah.rahman@gmail.com',
        email: 'aisyah.rahman@gmail.com',
        name: 'Aisyah Rahman',
        walletAddress: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
      }
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('exchanges the embedded-wallet access token for a backend session', async () => {
    const session = await createPrivyAccountSession('privy-access-token', 'privy-id-token');

    expect(session.user.email).toBe('aisyah.rahman@gmail.com');
    expect(mockedApiClient.postWithHeaders).toHaveBeenCalledWith(
      '/auth/session',
      { identityToken: 'privy-id-token' },
      {
        Authorization: 'Bearer privy-access-token'
      },
      undefined
    );
  });

  it('throws when the backend does not return a session envelope', async () => {
    mockedApiClient.postWithHeaders.mockResolvedValue(undefined);

    await expect(createPrivyAccountSession('privy-access-token')).rejects.toThrow(
      'Authentication did not return a session.'
    );
  });
});
