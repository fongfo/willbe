import { HandoverService } from '../../src/handover/handover.service';
import type { HandoverRepositories } from '../../src/handover/handover.service';

interface MockRepositories extends HandoverRepositories {
  trustedContacts: { findAll: jest.Mock };
  assetReferences: { findAll: jest.Mock };
}

function createMockRepositories(): MockRepositories {
  return {
    trustedContacts: { findAll: jest.fn().mockResolvedValue([]) },
    assetReferences: { findAll: jest.fn().mockResolvedValue([]) }
  };
}

describe('HandoverService', () => {
  let repositories: MockRepositories;
  let service: HandoverService;

  beforeEach(() => {
    repositories = createMockRepositories();
    service = new HandoverService(repositories);
  });

  it('returns an empty view when there is no data', async () => {
    const result = await service.preview();

    expect(result.contacts).toEqual([]);
    expect(result.locations).toEqual([]);
    expect(result.summary.contactCount).toBe(0);
  });

  it('assembles the view from the contact and asset repositories', async () => {
    repositories.trustedContacts.findAll.mockResolvedValue([
      { name: 'Imran', relation: 'SPOUSE', role: 'PRIMARY', phone: '+60111', email: null }
    ]);
    repositories.assetReferences.findAll.mockResolvedValue([
      { name: 'Maybank', category: 'BANK', locationHint: '▸ Drive ▸ Banking', detail: 'balance RM9k' }
    ]);

    const result = await service.preview();

    expect(result.contacts).toHaveLength(1);
    expect(result.contacts.map((c) => c.name)).toEqual(['Imran']);
    expect(result.locations).toHaveLength(1);
    expect(result.locations.map((l) => l.documented)).toEqual([true]);
    // The sensitive asset detail must not surface anywhere in the view.
    expect(JSON.stringify(result)).not.toContain('balance');
  });
});
