import { HandoverService } from '../../src/handover/handover.service';
import type { HandoverRepositories } from '../../src/handover/handover.service';

interface MockRepositories extends HandoverRepositories {
  familyMembers: { findAll: jest.Mock };
  trustedContacts: { findAll: jest.Mock };
  assetReferences: { findAll: jest.Mock };
  handoverInstructions: { get: jest.Mock };
}

function createMockRepositories(): MockRepositories {
  return {
    familyMembers: { findAll: jest.fn().mockResolvedValue([]) },
    trustedContacts: { findAll: jest.fn().mockResolvedValue([]) },
    assetReferences: { findAll: jest.fn().mockResolvedValue([]) },
    handoverInstructions: { get: jest.fn().mockResolvedValue(null) }
  };
}

describe('HandoverService', () => {
  const userId = 'user-1';
  let repositories: MockRepositories;
  let service: HandoverService;

  beforeEach(() => {
    repositories = createMockRepositories();
    service = new HandoverService(repositories);
  });

  it('returns an empty view when there is no data', async () => {
    const result = await service.preview(userId);

    expect(result.family).toEqual([]);
    expect(result.contacts).toEqual([]);
    expect(result.locations).toEqual([]);
    expect(result.summary.contactCount).toBe(0);
  });

  it('assembles the view from the family, contact, and asset repositories', async () => {
    repositories.familyMembers.findAll.mockResolvedValue([
      { name: 'Amina', relation: 'CHILD', detail: 'Lives with Aisyah' }
    ]);
    repositories.trustedContacts.findAll.mockResolvedValue([
      { name: 'Imran', relation: 'SPOUSE', role: 'PRIMARY', phone: '+60111', email: null }
    ]);
    repositories.assetReferences.findAll.mockResolvedValue([
      { name: 'Maybank', category: 'BANK', locationHint: '▸ Drive ▸ Banking', detail: 'balance RM9k' }
    ]);

    const result = await service.preview(userId);

    expect(result.family).toHaveLength(1);
    expect(result.family.map((member) => member.name)).toEqual(['Amina']);
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts.map((c) => c.name)).toEqual(['Imran']);
    expect(result.locations).toHaveLength(1);
    expect(result.locations.map((l) => l.documented)).toEqual([true]);
    // The sensitive asset detail must not surface anywhere in the view.
    expect(JSON.stringify(result)).not.toContain('balance');
  });

  it('passes the authenticated user id to each repository', async () => {
    await service.preview(userId);

    expect(repositories.familyMembers.findAll).toHaveBeenCalledWith(userId);
    expect(repositories.trustedContacts.findAll).toHaveBeenCalledWith(userId);
    expect(repositories.assetReferences.findAll).toHaveBeenCalledWith(userId);
    expect(repositories.handoverInstructions.get).toHaveBeenCalledWith(userId);
  });

  it('uses contact-safe handover filtering for emergency contacts', async () => {
    repositories.familyMembers.findAll.mockResolvedValue([
      { name: 'Amina', relation: 'CHILD', detail: 'Private family note' }
    ]);
    repositories.trustedContacts.findAll.mockResolvedValue([
      { name: 'Imran', relation: 'SPOUSE', role: 'PRIMARY', phone: '+60111', email: null, verificationStatus: 'VERIFIED' },
      { name: 'Draft', relation: 'OTHER', role: 'BACKUP', phone: '+60222', email: null, verificationStatus: 'PENDING' }
    ]);

    const result = await service.preview(userId, { mode: 'contact' });

    expect(result.family[0]?.detail).toBeNull();
    expect(result.contacts.map((contact) => contact.name)).toEqual(['Imran']);
  });
});
