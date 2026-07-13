jest.mock('../../src/db/client', () => ({
  prisma: {
    reviewSetting: {
      findUnique: jest.fn(),
      upsert: jest.fn()
    }
  }
}));

import { prisma } from '../../src/db/client';
import { ReviewSettingRepository } from '../../src/review-settings/review-setting.repository';

const mockedPrisma = prisma as unknown as {
  reviewSetting: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
};

const sampleSetting = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  checkInFrequency: 'EVERY_6_MONTHS',
  connectedProviders: ['GOOGLE_DRIVE'],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z')
};

describe('ReviewSettingRepository', () => {
  let repository: ReviewSettingRepository;
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ReviewSettingRepository();
  });

  describe('get', () => {
    it('returns the user setting via findUnique', async () => {
      mockedPrisma.reviewSetting.findUnique.mockResolvedValue(sampleSetting);

      const result = await repository.get(userId);

      expect(mockedPrisma.reviewSetting.findUnique).toHaveBeenCalledWith({
        where: { userId }
      });
      expect(result).toBe(sampleSetting);
    });

    it('returns null when no setting has been saved', async () => {
      mockedPrisma.reviewSetting.findUnique.mockResolvedValue(null);

      const result = await repository.get(userId);

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    const input = {
      checkInFrequency: 'EVERY_3_MONTHS' as const,
      connectedProviders: ['DROPBOX' as const]
    };

    it('upserts by user id', async () => {
      mockedPrisma.reviewSetting.upsert.mockResolvedValue({ ...sampleSetting, ...input });

      const result = await repository.upsert(userId, input);

      expect(mockedPrisma.reviewSetting.upsert).toHaveBeenCalledWith({
        where: { userId },
        create: { ...input, userId },
        update: input
      });
      expect(result).toMatchObject(input);
    });
  });
});
