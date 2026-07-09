import { prisma } from '../db/client';
import type { UserModel as User } from '../generated/prisma/models';
import type { VerifiedAuthUser } from './user.schema';

export class UserRepository {
  upsertFromVerifiedIdentity(identity: VerifiedAuthUser): Promise<User> {
    return prisma.user.upsert({
      where: { privyUserId: identity.privyUserId },
      create: identity,
      update: {
        email: identity.email,
        name: identity.name,
        walletAddress: identity.walletAddress
      }
    });
  }
}
