import { fireEvent, render, screen } from '@testing-library/react-native';
import HomeRoute from '../src/app/(tabs)/home';
import * as assetApi from '../src/asset-references/assetReference.api';
import type { AssetReference } from '../src/asset-references/assetReference.types';
import * as familyApi from '../src/family-members/familyMember.api';
import type { FamilyMember } from '../src/family-members/familyMember.types';
import HomeDashboardScreen from '../src/home/HomeDashboardScreen';
import * as contactApi from '../src/trusted-contacts/trustedContact.api';
import type { TrustedContact } from '../src/trusted-contacts/trustedContact.types';

jest.mock('../src/family-members/familyMember.api');
jest.mock('../src/trusted-contacts/trustedContact.api');
jest.mock('../src/asset-references/assetReference.api');
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn()
  }
}));

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

function mockDashboardData({
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

describe('HomeDashboardScreen', () => {
  it('renders the dashboard score and counts', async () => {
    mockDashboardData({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact(), makeContact({ id: 'c2', role: 'BACKUP' })],
      assetReferences: [makeAsset()]
    });

    render(<HomeDashboardScreen onNavigate={jest.fn()} />);

    expect(await screen.findByText('100')).toBeTruthy();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Preview emergency handover')).toBeTruthy();
  });

  it('opens the next best action route', async () => {
    const onNavigate = jest.fn();
    mockDashboardData({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact()],
      assetReferences: []
    });

    render(<HomeDashboardScreen onNavigate={onNavigate} />);
    expect(await screen.findByText('Strengthen trusted contacts')).toBeTruthy();

    fireEvent.press(screen.getByText('Open next step'));

    expect(onNavigate).toHaveBeenCalledWith('/trusted-contacts');
  });

  it('links to the plan and readiness dashboards', async () => {
    const onNavigate = jest.fn();
    mockDashboardData({});

    render(<HomeDashboardScreen onNavigate={onNavigate} />);
    await screen.findByText('Next best action');

    fireEvent.press(screen.getByText('View plan'));
    fireEvent.press(screen.getByText('Review readiness'));

    expect(onNavigate).toHaveBeenCalledWith('/plan');
    expect(onNavigate).toHaveBeenCalledWith('/readiness');
  });

  it('surfaces dashboard load errors', async () => {
    mockedFamilyApi.listFamilyMembers.mockRejectedValue(new Error('Network down'));
    mockedContactApi.listTrustedContacts.mockResolvedValue([]);
    mockedAssetApi.listAssetReferences.mockResolvedValue([]);

    render(<HomeDashboardScreen onNavigate={jest.fn()} />);

    expect(await screen.findByText('Network down')).toBeTruthy();
  });

  it('is exposed through the home tab route', async () => {
    mockDashboardData({});

    render(<HomeRoute />);

    expect(await screen.findByText('Preparedness score')).toBeTruthy();
  });
});
