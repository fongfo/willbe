import { ReadinessService } from '../../src/readiness/readiness.service';
import type { ReadinessRepositories } from '../../src/readiness/readiness.service';

interface MockRepositories extends ReadinessRepositories {
  familyMembers: { findAll: jest.Mock };
  trustedContacts: { findAll: jest.Mock };
  assetReferences: { findAll: jest.Mock };
  reviewSetting: { get: jest.Mock };
}

function createMockRepositories(): MockRepositories {
  return {
    familyMembers: { findAll: jest.fn().mockResolvedValue([]) },
    trustedContacts: { findAll: jest.fn().mockResolvedValue([]) },
    assetReferences: { findAll: jest.fn().mockResolvedValue([]) },
    reviewSetting: { get: jest.fn().mockResolvedValue(null) }
  };
}

describe('ReadinessService', () => {
  const userId = 'user-1';
  let repositories: MockRepositories;
  let service: ReadinessService;

  beforeEach(() => {
    repositories = createMockRepositories();
    service = new ReadinessService(repositories);
  });

  it('produces the full gap set from an empty plan (defaults when no review setting saved)', async () => {
    const result = await service.assess(userId);

    const codes = result.gaps.map((gap) => gap.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'ADD_FAMILY_MEMBER',
        'ADD_BACKUP_CONTACT',
        'ADD_ASSET_REFERENCES',
        'ADD_ADVISOR_CONTACT',
        'CONNECT_CLOUD_PROVIDER',
        'ADD_BENEFICIARY_NOTES'
      ])
    );
    // No review setting saved => default EVERY_6_MONTHS, so the custom-reminder gap is absent.
    expect(codes).not.toContain('CLARIFY_CUSTOM_REMINDER');
  });

  it('detects an advisor contact via the free-text detail field', async () => {
    repositories.trustedContacts.findAll.mockResolvedValue([
      { name: 'Jane Tan', detail: 'Family lawyer at Tan & Co' },
      { name: 'Ahmad', detail: null }
    ]);

    const result = await service.assess(userId);

    expect(result.gaps.map((gap) => gap.code)).not.toContain('ADD_ADVISOR_CONTACT');
  });

  it('detects a beneficiary note via the asset detail field', async () => {
    repositories.assetReferences.findAll.mockResolvedValue([
      { detail: 'Beneficiary already nominated' }
    ]);

    const result = await service.assess(userId);

    expect(result.gaps.map((gap) => gap.code)).not.toContain('ADD_BENEFICIARY_NOTES');
  });

  it('reads connected providers and frequency from the review setting', async () => {
    repositories.reviewSetting.get.mockResolvedValue({
      checkInFrequency: 'CUSTOM_ANNUAL',
      connectedProviders: ['GOOGLE_DRIVE']
    });

    const result = await service.assess(userId);

    const codes = result.gaps.map((gap) => gap.code);
    expect(codes).toContain('CLARIFY_CUSTOM_REMINDER');
    expect(codes).not.toContain('CONNECT_CLOUD_PROVIDER');
  });

  it('returns a 96 score with no gaps for a fully prepared plan', async () => {
    repositories.familyMembers.findAll.mockResolvedValue([{}, {}]);
    repositories.trustedContacts.findAll.mockResolvedValue([
      { name: 'Advisor Lim', detail: 'financial planner' },
      { name: 'Backup', detail: null }
    ]);
    repositories.assetReferences.findAll.mockResolvedValue([
      { detail: 'beneficiary nominated' },
      { detail: null },
      { detail: null }
    ]);
    repositories.reviewSetting.get.mockResolvedValue({
      checkInFrequency: 'EVERY_6_MONTHS',
      connectedProviders: ['GOOGLE_DRIVE', 'ONEDRIVE']
    });

    const result = await service.assess(userId);

    expect(result.gaps).toEqual([]);
    expect(result.score).toBe(96);
  });

  it('passes the authenticated user id to each repository', async () => {
    await service.assess(userId);

    expect(repositories.familyMembers.findAll).toHaveBeenCalledWith(userId);
    expect(repositories.trustedContacts.findAll).toHaveBeenCalledWith(userId);
    expect(repositories.assetReferences.findAll).toHaveBeenCalledWith(userId);
    expect(repositories.reviewSetting.get).toHaveBeenCalledWith(userId);
  });
});
