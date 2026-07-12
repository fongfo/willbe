import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { shouldUsePrivyRuntime } from '../privy/privyConfig';
import { createPrivyAccountSession } from './auth.api';
import type { AccountUser, AuthSession } from './auth.types';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';
type WalletStatus = 'ready' | 'pending' | 'error';

interface VerifyEmailCodeInput {
  email: string;
  code: string;
}

interface AccountAuthContextValue {
  status: AuthStatus;
  user: AccountUser | null;
  error: string | null;
  walletStatus: WalletStatus;
  walletError: string | null;
  sendEmailCode(email: string): Promise<void>;
  verifyEmailCode(input: VerifyEmailCodeInput): Promise<void>;
  retryWalletSync(): Promise<void>;
  signOut(): Promise<void>;
}

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

const AccountAuthContext = createContext<AccountAuthContextValue | null>(null);
const PRIVY_REQUEST_TIMEOUT_MS = 20000;
let devSession: AuthSession | null = null;

function messageFromError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

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

function DevAccountAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(devSession);

  function setSession(nextSession: AuthSession | null): void {
    devSession = nextSession;
    setSessionState(nextSession);
  }

  const value = useMemo<AccountAuthContextValue>(
    () => ({
      status: session ? 'authenticated' : 'unauthenticated',
      user: session?.user ?? null,
      error: null,
      walletStatus: session?.user.walletAddress ? 'ready' : 'pending',
      walletError: null,
      sendEmailCode: async () => undefined,
      verifyEmailCode: async ({ email }) => {
        setSession({
          user: {
            id: 'dev-user-1',
            privyUserId: `dev:${email}`,
            email,
            name: null,
            walletAddress: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
          }
        });
      },
      retryWalletSync: async () => undefined,
      signOut: async () => setSession(null)
    }),
    [session]
  );

  return <AccountAuthContext.Provider value={value}>{children}</AccountAuthContext.Provider>;
}

function PrivyAccountAuthProvider({ children }: { children: ReactNode }) {
  // Keep the SDK import aligned with PrivyAppProvider so context comes from one module instance.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEmbeddedEthereumWallet, useIdentityToken, useLoginWithEmail, usePrivy } = require(
    '@privy-io/expo'
  ) as PrivyExpoRuntime;
  const { user: privyUser, isReady, error: privyError, logout, getAccessToken } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { getIdentityToken } = useIdentityToken();
  const { wallets, create } = useEmbeddedEthereumWallet();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [restoreAttemptedFor, setRestoreAttemptedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('pending');
  const [walletError, setWalletError] = useState<string | null>(null);
  const sessionRequestRef = useRef<Promise<AuthSession> | null>(null);
  const shouldRestore =
    isReady &&
    Boolean(privyUser) &&
    !session &&
    restoreAttemptedFor !== privyUser?.id;
  const status: AuthStatus =
    !isReady || shouldRestore
      ? 'checking'
      : session && privyUser
        ? 'authenticated'
        : 'unauthenticated';
  const currentUser = status === 'authenticated' ? session?.user ?? null : null;

  const createBackendSession = useCallback(async (): Promise<AuthSession> => {
    if (sessionRequestRef.current) {
      return sessionRequestRef.current;
    }

    const request = (async (): Promise<AuthSession> => {
      const accessToken = await withTimeout(
        getAccessToken(),
        'Session restore timed out. Check your network and try again.'
      );
      if (!accessToken) {
        throw new Error('Privy access token is missing.');
      }
      const identityToken = await withTimeout(
        getIdentityToken(),
        'Identity token request timed out. Check your network and try again.'
      );
      return withTimeout(
        createPrivyAccountSession(accessToken, identityToken),
        'Creating the account session timed out. Check the API connection and try again.'
      );
    })();

    sessionRequestRef.current = request;
    try {
      return await request;
    } finally {
      sessionRequestRef.current = null;
    }
  }, [getAccessToken, getIdentityToken]);

  const syncWalletAddress = useCallback(async (currentSession: AuthSession): Promise<void> => {
    setWalletStatus('pending');
    setWalletError(null);
    try {
      const existingWallet = wallets[0]?.address;
      const walletAddress =
        existingWallet ??
        walletAddressFromPrivyUser(
          (
            await withTimeout(
              create(),
              'Proof wallet setup timed out. You can retry from Account.'
            )
          ).user
        );
      const nextSession = mergeWalletAddress(currentSession, walletAddress);
      setSession(nextSession);
      setWalletStatus(nextSession.user.walletAddress ? 'ready' : 'pending');
    } catch (caughtError: unknown) {
      setWalletStatus('error');
      setWalletError(messageFromError(caughtError));
    }
  }, [create, wallets]);

  const establishSession = useCallback(async (): Promise<void> => {
    const nextSession = await createBackendSession();
    setSession(nextSession);
    void syncWalletAddress(nextSession);
  }, [createBackendSession, syncWalletAddress]);

  const restoreExistingSession = useCallback(
    async (privyUserId: string): Promise<void> => {
      setRestoreAttemptedFor(privyUserId);
      await establishSession();
    },
    [establishSession]
  );

  useEffect(() => {
    if (!isReady || !privyUser || session || restoreAttemptedFor === privyUser.id) {
      return;
    }

    let cancelled = false;
    Promise.resolve()
      .then(() => restoreExistingSession(privyUser.id))
      .catch((caughtError: unknown) => {
        if (!cancelled) {
          setError(messageFromError(caughtError));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, privyUser, restoreAttemptedFor, restoreExistingSession, session]);

  const value = useMemo<AccountAuthContextValue>(
    () => ({
      status,
      user: currentUser,
      error: error ?? privyError?.message ?? null,
      walletStatus,
      walletError,
      sendEmailCode: async (email: string) => {
        setError(null);
        await withTimeout(
          sendCode({ email }),
          'Sending the email code timed out. Check your network and try again.'
        );
      },
      verifyEmailCode: async ({ email, code }: VerifyEmailCodeInput) => {
        setError(null);
        if (!privyUser) {
          await withTimeout(
            loginWithCode({ email, code }),
            'Verifying the email code timed out. Check your network and try again.'
          );
        }
        await establishSession();
      },
      retryWalletSync: async () => {
        if (session) {
          await syncWalletAddress(session);
        }
      },
      signOut: async () => {
        await logout();
        setSession(null);
        setRestoreAttemptedFor(null);
        setWalletStatus('pending');
        setWalletError(null);
      }
    }),
    [
      error,
      establishSession,
      currentUser,
      loginWithCode,
      logout,
      privyError,
      privyUser,
      sendCode,
      session,
      status,
      syncWalletAddress,
      walletError,
      walletStatus
    ]
  );

  return <AccountAuthContext.Provider value={value}>{children}</AccountAuthContext.Provider>;
}

export function AccountAuthProvider({ children }: { children: ReactNode }) {
  if (!shouldUsePrivyRuntime()) {
    return <DevAccountAuthProvider>{children}</DevAccountAuthProvider>;
  }

  return <PrivyAccountAuthProvider>{children}</PrivyAccountAuthProvider>;
}

export function useAccountAuth(): AccountAuthContextValue {
  const context = useContext(AccountAuthContext);
  if (!context) {
    throw new Error('useAccountAuth must be used within AccountAuthProvider.');
  }
  return context;
}

export function resetDevAccountAuth(): void {
  devSession = null;
}
