import type { UserModel as User } from '../generated/prisma/models';
import type { UserService } from '../users/user.service';
import type { TokenVerifier } from './token-verifier';

export interface AuthSession {
  user: User;
}

export class AuthService {
  constructor(
    private readonly verifier: TokenVerifier,
    private readonly users: UserService
  ) {}

  async createSession(accessToken: string, identityToken?: string): Promise<AuthSession> {
    const identity = await this.verifier.verify(accessToken, identityToken);
    const user = await this.users.syncFromVerifiedIdentity(identity);
    return { user };
  }
}
