import type { UserModel as User } from '../generated/prisma/models';
import type { VerifiedAuthUser } from './user.schema';

export interface UserRepositoryLike {
  upsertFromVerifiedIdentity(identity: VerifiedAuthUser): Promise<User>;
}

export class UserService {
  constructor(private readonly repository: UserRepositoryLike) {}

  syncFromVerifiedIdentity(identity: VerifiedAuthUser): Promise<User> {
    return this.repository.upsertFromVerifiedIdentity(identity);
  }
}
