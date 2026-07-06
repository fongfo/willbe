import { render, screen } from '@testing-library/react-native';
import ReadinessRoute from '../src/app/(tabs)/readiness';
import ReadinessScreen from '../src/readiness/ReadinessScreen';
import * as assetApi from '../src/asset-references/assetReference.api';
import type { AssetReference } from '../src/asset-references/assetReference.types';
import * as familyApi from '../src/family-members/familyMember.api';
import type { FamilyMember } from '../src/family-members/familyMember.types';
import * as contactApi from '../src/trusted-contacts/trustedContact.api';
import type { TrustedContact } from '../src/trusted-contacts/trustedContact.types';

jest.mock('../src/family-members/familyMember.api');
jest.mock('../src/trusted-contacts/trustedContact.api');
jest.mock('../src/asset-references/assetReference.api');

const mockedFamilyApi = familyApi as jest.Mocked<typeof familyApi>;
const mockedContactApi = contactApi as jest.Mocked<typeof contactApi>;
const mockedAssetApi = assetApi as jest.Mocked<typeof assetApi>;

function makeMember(overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: 'f1',
    name: 'Amina',
    relation: 'SELF',
    detail: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides
  };
}

function makeContact(overrides: Partial<TrustedContact> = {}): TrustedContact {
  return {
    id: 'c1',
    name: 'Sara',
    relation: 'SIBLING',
    role: 'PRIMARY',
    phone: '+60123456789',
    email: null,
    verificationStatus: 'VERIFIED',
    detail: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides
  };
}

function makeAsset(overrides: Partial<AssetReference> = {}): AssetReference {
  return {
    id: 'a1',
    name: 'Maybank',
    category: 'BANK',
    locationHint: 'Drive / Family / Banking',
    detail: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides
  };
}

function mockReadinessData({
  familyMembers = [],
  trustedContacts = [],
  assetReferences = []
}: {
  familyMembers?: FamilyMember[];
  trustedContacts?: TrustedContact[];
  assetReferences?: AssetReference[];
}): void {
  mockedFamilyApi.listFamilyMembers.mockResolvedValue(familyMembers);
  mockedContactApi.listTrustedContacts.mockResolvedValue(trustedContacts);
  mockedAssetApi.listAssetReferences.mockResolvedValue(assetReferences);
}

afterEach(() => jest.clearAllMocks());

describe('ReadinessScreen', () => {
  it('renders a complete readiness score with no critical gaps', async () => {
    mockReadinessData({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact(), makeContact({ id: 'c2', role: 'BACKUP' })],
      assetReferences: [makeAsset()]
    });

    render(<ReadinessScreen />);

    expect(await screen.findByText('100')).toBeTruthy();
    expect(screen.getByText('No critical gaps right now')).toBeTruthy();
    expect(screen.getByText('5 of 5 core checks complete')).toBeTruthy();
  });

  it('lists actionable gaps for an incomplete plan', async () => {
    mockReadinessData({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact()],
      assetReferences: []
    });

    render(<ReadinessScreen />);

    expect(await screen.findByText('40')).toBeTruthy();
    expect(screen.getByText('Add two trusted contacts')).toBeTruthy();
    expect(screen.getByText('Add an asset reference')).toBeTruthy();
  });

  it('surfaces load errors from any readiness source', async () => {
    mockedFamilyApi.listFamilyMembers.mockResolvedValue([]);
    mockedContactApi.listTrustedContacts.mockRejectedValue(new Error('Network down'));
    mockedAssetApi.listAssetReferences.mockResolvedValue([]);

    render(<ReadinessScreen />);

    expect(await screen.findByText('Network down')).toBeTruthy();
  });

  it('is exposed through the readiness tab route', async () => {
    mockReadinessData({});

    render(<ReadinessRoute />);

    expect(await screen.findByText('Readiness')).toBeTruthy();
  });
});
