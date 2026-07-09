import type { UserModel as User } from '../../src/generated/prisma/models';
import { UserService } from '../../src/users/user.service';

const user: User = {
  id: 'user-1',
  privyUserId: 'dev:aisyah.rahman@gmail.com',
  email: 'aisyah.rahman@gmail.com',
  name: 'Aisyah Rahman',
  walletAddress: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e',
  createdAt: new Date('2026-07-09T00:00:00.000Z'),
  updatedAt: new Date('2026-07-09T00:00:00.000Z')
};

describe('UserService', () => {
  it('upserts a verified wallet identity through the repository', async () => {
    const repository = {
      upsertFromVerifiedIdentity: jest.fn().mockResolvedValue(user)
    };
    const service = new UserService(repository);

    const result = await service.syncFromVerifiedIdentity({
      privyUserId: user.privyUserId,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      walletAddress: user.walletAddress ?? undefined
    });

    expect(result).toBe(user);
    expect(repository.upsertFromVerifiedIdentity).toHaveBeenCalledWith({
      privyUserId: user.privyUserId,
      email: user.email,
      name: user.name,
      walletAddress: user.walletAddress
    });
  });
});
