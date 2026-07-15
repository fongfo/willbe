import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { createPrivyAccountSession } from '../src/account/auth.api';
import { AccountAuthProvider, useAccountAuth } from '../src/account/AccountAuthContext';

jest.mock('../src/privy/privyConfig', () => ({
  shouldUsePrivyRuntime: () => true
}));

jest.mock('../src/account/auth.api', () => ({
  createPrivyAccountSession: jest.fn()
}));

const mockPrivyState = {
  user: {
    id: 'did:privy:user-1',
    linkedAccounts: [] as {
      type: string;
      chain_type?: string;
      chainType?: string;
      address: string;
    }[]
  },
  wallets: [] as { address: string }[],
  create: jest.fn(),
  getAccessToken: jest.fn(),
  getIdentityToken: jest.fn(),
  sendCode: jest.fn(),
  loginWithCode: jest.fn(),
  logout: jest.fn()
};

jest.mock('@privy-io/expo', () => ({
  useEmbeddedEthereumWallet: () => ({
    wallets: mockPrivyState.wallets,
    create: mockPrivyState.create
  }),
  useIdentityToken: () => ({
    getIdentityToken: mockPrivyState.getIdentityToken
  }),
  useLoginWithEmail: () => ({
    sendCode: mockPrivyState.sendCode,
    loginWithCode: mockPrivyState.loginWithCode
  }),
  usePrivy: () => ({
    user: mockPrivyState.user,
    isReady: true,
    error: null,
    logout: mockPrivyState.logout,
    getAccessToken: mockPrivyState.getAccessToken
  })
}));

const mockedCreatePrivyAccountSession = createPrivyAccountSession as jest.MockedFunction<
  typeof createPrivyAccountSession
>;

function AuthProbe() {
  const { user, walletStatus, walletError } = useAccountAuth();
  return (
    <>
      <Text>{user?.walletAddress ?? 'no-wallet'}</Text>
      <Text>{walletStatus}</Text>
      <Text>{walletError ?? 'no-wallet-error'}</Text>
    </>
  );
}

describe('AccountAuthProvider wallet sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrivyState.user = {
      id: 'did:privy:user-1',
      linkedAccounts: []
    };
    mockPrivyState.wallets = [];
    mockPrivyState.create.mockResolvedValue({
      user: {
        linkedAccounts: [
          {
            type: 'wallet',
            chain_type: 'ethereum',
            address: '0x2222222222222222222222222222222222222222'
          }
        ]
      }
    });
    mockPrivyState.getAccessToken.mockResolvedValue('privy-access-token');
    mockPrivyState.getIdentityToken.mockResolvedValue('privy-identity-token');
    mockedCreatePrivyAccountSession.mockResolvedValue({
      user: {
        id: 'user-1',
        privyUserId: 'did:privy:user-1',
        email: 'aisyah.rahman@gmail.com',
        name: null,
        walletAddress: null
      }
    });
  });

  it('reuses the backend session wallet without creating another Privy wallet', async () => {
    mockedCreatePrivyAccountSession.mockResolvedValue({
      user: {
        id: 'user-1',
        privyUserId: 'did:privy:user-1',
        email: 'aisyah.rahman@gmail.com',
        name: null,
        walletAddress: '0x1111111111111111111111111111111111111111'
      }
    });

    render(
      <AccountAuthProvider>
        <AuthProbe />
      </AccountAuthProvider>
    );

    expect(await screen.findByText('0x1111111111111111111111111111111111111111')).toBeTruthy();
    expect(screen.getByText('ready')).toBeTruthy();
    expect(mockPrivyState.create).not.toHaveBeenCalled();
  });

  it('reuses a wallet from the authenticated Privy user before calling create', async () => {
    mockPrivyState.user = {
      id: 'did:privy:user-1',
      linkedAccounts: [
        {
          type: 'wallet',
          chain_type: 'ethereum',
          address: '0x3333333333333333333333333333333333333333'
        }
      ]
    };

    render(
      <AccountAuthProvider>
        <AuthProbe />
      </AccountAuthProvider>
    );

    expect(await screen.findByText('0x3333333333333333333333333333333333333333')).toBeTruthy();
    expect(screen.getByText('ready')).toBeTruthy();
    expect(mockPrivyState.create).not.toHaveBeenCalled();
  });

  it('creates a wallet for new users when no existing wallet is discoverable', async () => {
    render(
      <AccountAuthProvider>
        <AuthProbe />
      </AccountAuthProvider>
    );

    expect(await screen.findByText('0x2222222222222222222222222222222222222222')).toBeTruthy();
    expect(screen.getByText('ready')).toBeTruthy();
    expect(mockPrivyState.create).toHaveBeenCalledTimes(1);
  });

  it('uses the embedded wallet hook when create succeeds before the user payload includes the address', async () => {
    mockPrivyState.create.mockImplementation(() => {
      mockPrivyState.wallets.push({
        address: '0x5555555555555555555555555555555555555555'
      });
      return Promise.resolve({
        user: {
          linkedAccounts: []
        }
      });
    });

    render(
      <AccountAuthProvider>
        <AuthProbe />
      </AccountAuthProvider>
    );

    expect(await screen.findByText('0x5555555555555555555555555555555555555555')).toBeTruthy();
    expect(screen.getByText('ready')).toBeTruthy();
    expect(mockPrivyState.create).toHaveBeenCalledTimes(1);
  });

  it('recovers from wallet already exists by rereading embedded wallets', async () => {
    let createAttempts = 0;
    mockPrivyState.create.mockImplementation(() => {
      createAttempts += 1;
      mockPrivyState.wallets.push({
        address: '0x4444444444444444444444444444444444444444'
      });
      return Promise.reject(new Error('wallet already exists'));
    });

    render(
      <AccountAuthProvider>
        <AuthProbe />
      </AccountAuthProvider>
    );

    expect(await screen.findByText('0x4444444444444444444444444444444444444444')).toBeTruthy();
    expect(screen.getByText('ready')).toBeTruthy();
    await waitFor(() => expect(mockPrivyState.create).toHaveBeenCalledTimes(1));
    expect(createAttempts).toBe(1);
  });
});
