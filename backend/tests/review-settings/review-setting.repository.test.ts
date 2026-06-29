jest.mock('../../src/db/client', () => ({
  prisma: {
    reviewSetting: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  }
}));

import { prisma } from '../../src/db/client';
import { ReviewSettingRepository } from '../../src/review-settings/review-setting.repository';

const mockedPrisma = prisma as unknown as {
  reviewSetting: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
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

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ReviewSettingRepository();
  });

  describe('get', () => {
    it('returns the singleton via findFirst', async () => {
      mockedPrisma.reviewSetting.findFirst.mockResolvedValue(sampleSetting);

      const result = await repository.get();

      expect(mockedPrisma.reviewSetting.findFirst).toHaveBeenCalledTimes(1);
      expect(result).toBe(sampleSetting);
    });

    it('returns null when no setting has been saved', async () => {
      mockedPrisma.reviewSetting.findFirst.mockResolvedValue(null);

      const result = await repository.get();

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    const input = {
      checkInFrequency: 'EVERY_3_MONTHS' as const,
      connectedProviders: ['DROPBOX' as const]
    };

    it('creates a new row when none exists', async () => {
      mockedPrisma.reviewSetting.findFirst.mockResolvedValue(null);
      mockedPrisma.reviewSetting.create.mockResolvedValue({ ...sampleSetting, ...input });

      const result = await repository.upsert(input);

      expect(mockedPrisma.reviewSetting.create).toHaveBeenCalledWith({ data: input });
      expect(mockedPrisma.reviewSetting.update).not.toHaveBeenCalled();
      expect(result).toMatchObject(input);
    });

    it('updates the existing row when one exists', async () => {
      mockedPrisma.reviewSetting.findFirst.mockResolvedValue(sampleSetting);
      mockedPrisma.reviewSetting.update.mockResolvedValue({ ...sampleSetting, ...input });

      const result = await repository.upsert(input);

      expect(mockedPrisma.reviewSetting.update).toHaveBeenCalledWith({
        where: { id: sampleSetting.id },
        data: input
      });
      expect(mockedPrisma.reviewSetting.create).not.toHaveBeenCalled();
      expect(result).toMatchObject(input);
    });
  });
});
