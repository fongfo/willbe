import { HttpError } from '../shared/http-error';
import { verifiedAuthUserSchema, type VerifiedAuthUser } from '../users/user.schema';

export interface TokenVerifier {
  verify(accessToken: string): Promise<VerifiedAuthUser>;
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
