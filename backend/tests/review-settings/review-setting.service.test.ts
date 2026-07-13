import { ReviewSettingService } from '../../src/review-settings/review-setting.service';

interface MockReviewSettingRepository {
  get: jest.Mock;
  upsert: jest.Mock;
}

function createMockRepository(): MockReviewSettingRepository {
  return {
    get: jest.fn(),
    upsert: jest.fn()
  };
}

const sampleSetting = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  checkInFrequency: 'EVERY_12_MONTHS',
  connectedProviders: ['GOOGLE_DRIVE', 'ICLOUD'],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z')
};

describe('ReviewSettingService', () => {
  const userId = 'user-1';
  let repository: MockReviewSettingRepository;
  let service: ReviewSettingService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new ReviewSettingService(repository);
  });

  describe('get', () => {
    it('returns the persisted setting when one exists', async () => {
      repository.get.mockResolvedValue(sampleSetting);

      const result = await service.get(userId);

      expect(repository.get).toHaveBeenCalledWith(userId);
      expect(result).toBe(sampleSetting);
    });

    it('returns a sensible default when no setting has been saved', async () => {
      repository.get.mockResolvedValue(null);

      const result = await service.get(userId);

      expect(result).toEqual({
        checkInFrequency: 'EVERY_6_MONTHS',
        connectedProviders: []
      });
      expect(repository.upsert).not.toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('delegates to repository.upsert and returns its result', async () => {
      const input = {
        checkInFrequency: 'EVERY_3_MONTHS' as const,
        connectedProviders: ['DROPBOX' as const]
      };
      repository.upsert.mockResolvedValue({ ...sampleSetting, ...input });

      const result = await service.save(userId, input);

      expect(repository.upsert).toHaveBeenCalledWith(userId, input);
      expect(result).toMatchObject(input);
    });
  });
});
