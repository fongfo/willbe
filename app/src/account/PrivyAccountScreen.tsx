import { AccountView, type AccountController } from './AccountScreen';
import { createPrivyAccountSession } from './auth.api';
import type { AuthSession } from './auth.types';

type PrivyExpoRuntime = Pick<
  typeof import('@privy-io/expo'),
  'useEmbeddedEthereumWallet' | 'useIdentityToken' | 'useLoginWithEmail' | 'usePrivy'
>;

interface PrivyLinkedAccountLike {
  type?: string;
  chain_type?: string;
  chainType?: string;
  address?: string;
}

interface PrivyUserLike {
  linkedAccounts?: PrivyLinkedAccountLike[];
  linked_accounts?: PrivyLinkedAccountLike[];
}

const PRIVY_REQUEST_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(message));
    }, PRIVY_REQUEST_TIMEOUT_MS);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

function walletAddressFromPrivyUser(user: unknown): string | undefined {
  const candidate = user as PrivyUserLike;
  const accounts = candidate.linkedAccounts ?? candidate.linked_accounts ?? [];
  return accounts.find(
    (account) =>
      account.type === 'wallet' &&
      (account.chain_type ?? account.chainType) === 'ethereum' &&
      account.address
  )?.address;
}

function mergeWalletAddress(session: AuthSession, walletAddress?: string): AuthSession {
  if (!walletAddress || session.user.walletAddress) {
    return session;
  }
  return {
    user: {
      ...session.user,
      walletAddress
    }
  };
}

export default function PrivyAccountScreen() {
  // Match PrivyAppProvider's runtime import path so React context comes from one SDK instance.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEmbeddedEthereumWallet, useIdentityToken, useLoginWithEmail, usePrivy } = require(
    '@privy-io/expo'
  ) as PrivyExpoRuntime;
  const { user, isReady, error: privyError, logout, getAccessToken } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { getIdentityToken } = useIdentityToken();
  const { wallets, create } = useEmbeddedEthereumWallet();

  async function ensureWalletAddress(): Promise<string | undefined> {
    const existingWallet = wallets[0]?.address;
    if (existingWallet) {
      return existingWallet;
    }

    const result = await withTimeout(
      create(),
      'Creating the embedded wallet timed out. Check your network and try again.'
    );
    return walletAddressFromPrivyUser(result.user);
  }

  async function createAccountSession(): Promise<AuthSession> {
    const accessToken = await withTimeout(
      getAccessToken(),
      'Privy session restore timed out. Check your network and try again.'
    );
    if (!accessToken) {
      throw new Error('Privy access token is missing.');
    }
    const identityToken = await withTimeout(
      getIdentityToken(),
      'Privy identity token request timed out. Check your network and try again.'
    );
    const session = await withTimeout(
      createPrivyAccountSession(accessToken, identityToken),
      'Creating the account session timed out. Check the API connection and try again.'
    );
    const walletAddress = await ensureWalletAddress();
    return mergeWalletAddress(session, walletAddress);
  }

  const controller: AccountController = {
    isReady,
    existingSessionKey: user?.id ?? null,
    statusText: privyError?.message,
    sendCode: async (email: string) => {
      await withTimeout(
        sendCode({ email }),
        'Sending the email code timed out. Check your network and Privy configuration, then try again.'
      );
    },
    verifyCode: async ({ email, code }) => {
      if (!user) {
        await withTimeout(
          loginWithCode({ email, code }),
          'Verifying the email code timed out. Check your network and try again.'
        );
      }
      return createAccountSession();
    },
    getCurrentSession: async () => (user ? createAccountSession() : null),
    signOut: logout
  };

  return <AccountView controller={controller} />;
}
