import { HttpError } from '../shared/http-error';
import { verifiedAuthUserSchema, type VerifiedAuthUser } from '../users/user.schema';

export interface TokenVerifier {
  verify(accessToken: string, identityToken?: string): Promise<VerifiedAuthUser>;
}

interface PrivyAccessTokenClaims {
  user_id?: string;
  sub?: string;
}

type PrivyLinkedAccount = Record<string, unknown>;

interface PrivyIdentity {
  id?: string;
  userId?: string;
  linkedAccounts?: PrivyLinkedAccount[];
  linked_accounts?: PrivyLinkedAccount[];
}

export interface PrivyAuthClientLike {
  verifyAccessToken(accessToken: string): Promise<unknown>;
  verifyIdentityToken(identityToken: string): Promise<unknown>;
}

function stableWalletAddress(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return `0x${hash.toString(16).padStart(8, '0').repeat(5)}`.slice(0, 42);
}

function decodePart(part: string | undefined): string | undefined {
  if (!part) {
    return undefined;
  }
  return decodeURIComponent(part);
}

export class DevTokenVerifier implements TokenVerifier {
  constructor(
    private readonly allowDevAuth =
      process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_AUTH === 'true'
  ) {}

  async verify(accessToken: string): Promise<VerifiedAuthUser> {
    if (!this.allowDevAuth) {
      throw new HttpError(503, 'Privy token verifier is not configured');
    }

    const [scheme, encodedEmail, encodedName] = accessToken.split(':');
    if (scheme !== 'dev' || !encodedEmail) {
      throw new HttpError(401, 'Invalid access token');
    }

    const email = decodePart(encodedEmail);
    const name = decodePart(encodedName);
    const parsed = verifiedAuthUserSchema.safeParse({
      privyUserId: `dev:${email}`,
      email,
      name,
      walletAddress: stableWalletAddress(email ?? accessToken)
    });

    if (!parsed.success) {
      throw new HttpError(401, parsed.error.issues[0]?.message ?? 'Invalid access token');
    }
    return parsed.data;
  }
}

function readString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asPrivyIdentity(value: unknown): PrivyIdentity {
  const record = asRecord(value);
  const linkedAccounts = record.linkedAccounts;
  const linked_accounts = record.linked_accounts;
  return {
    id: readString(record, 'id'),
    userId: readString(record, 'userId'),
    linkedAccounts: Array.isArray(linkedAccounts)
      ? linkedAccounts.map((account) => asRecord(account))
      : undefined,
    linked_accounts: Array.isArray(linked_accounts)
      ? linked_accounts.map((account) => asRecord(account))
      : undefined
  };
}

function getLinkedAccounts(identity: PrivyIdentity): PrivyLinkedAccount[] {
  return identity.linkedAccounts ?? identity.linked_accounts ?? [];
}

function extractPrivyUserId(claims: PrivyAccessTokenClaims): string {
  const id = claims.user_id ?? claims.sub;
  if (!id) {
    throw new HttpError(401, 'Invalid access token');
  }
  return id;
}

function extractEmail(accounts: PrivyLinkedAccount[]): string | undefined {
  const account = accounts.find((item) => readString(item, 'type') === 'email');
  return account
    ? readString(account, 'address') ?? readString(account, 'email')
    : undefined;
}

function extractName(accounts: PrivyLinkedAccount[]): string | undefined {
  const account = accounts.find((item) => readString(item, 'type') === 'email');
  return account ? readString(account, 'name') : undefined;
}

function extractWalletAddress(accounts: PrivyLinkedAccount[]): string | undefined {
  const account = accounts.find(
    (item) =>
      readString(item, 'type') === 'wallet' &&
      (readString(item, 'chain_type') ?? readString(item, 'chainType')) === 'ethereum'
  );
  return account ? readString(account, 'address') : undefined;
}

export class PrivyTokenVerifier implements TokenVerifier {
  constructor(private readonly authClient: PrivyAuthClientLike) {}

  async verify(accessToken: string, identityToken?: string): Promise<VerifiedAuthUser> {
    try {
      const claims = asRecord(await this.authClient.verifyAccessToken(accessToken));
      const privyUserId = extractPrivyUserId(claims);
      const identity = identityToken
        ? asPrivyIdentity(await this.authClient.verifyIdentityToken(identityToken))
        : undefined;

      if (identity?.id && identity.id !== privyUserId) {
        throw new HttpError(401, 'Privy identity token does not match access token');
      }
      if (identity?.userId && identity.userId !== privyUserId) {
        throw new HttpError(401, 'Privy identity token does not match access token');
      }

      const linkedAccounts = identity ? getLinkedAccounts(identity) : [];
      const parsed = verifiedAuthUserSchema.safeParse({
        privyUserId,
        email: extractEmail(linkedAccounts),
        name: extractName(linkedAccounts),
        walletAddress: extractWalletAddress(linkedAccounts)
      });

      if (!parsed.success) {
        throw new HttpError(
          401,
          parsed.error.issues[0]?.message ?? 'Invalid access token'
        );
      }
      return parsed.data;
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(401, 'Invalid access token');
    }
  }
}

export function createTokenVerifier(): TokenVerifier {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (appId && appSecret && process.env.NODE_ENV !== 'test') {
    // Lazy-load the SDK so Jest's CommonJS runtime does not parse its ESM deps.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const { PrivyClient } = require('@privy-io/node') as typeof import('@privy-io/node');
    const client = new PrivyClient({
      appId,
      appSecret,
      jwtVerificationKey: process.env.PRIVY_JWT_VERIFICATION_KEY
    });
    return new PrivyTokenVerifier(client.utils().auth());
  }

  return new DevTokenVerifier();
}
