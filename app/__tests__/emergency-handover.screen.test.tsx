import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import EmergencyHandoverRoute from '../src/app/emergency-handover';
import * as assetApi from '../src/asset-references/assetReference.api';
import type { AssetReference } from '../src/asset-references/assetReference.types';
import EmergencyHandoverScreen from '../src/emergency-handover/EmergencyHandoverScreen';
import * as familyApi from '../src/family-members/familyMember.api';
import type { FamilyMember } from '../src/family-members/familyMember.types';
import * as handoverInstructionApi from '../src/handover-instructions/handoverInstruction.api';
import * as contactApi from '../src/trusted-contacts/trustedContact.api';
import type { TrustedContact } from '../src/trusted-contacts/trustedContact.types';

jest.mock('../src/family-members/familyMember.api');
jest.mock('../src/trusted-contacts/trustedContact.api');
jest.mock('../src/asset-references/assetReference.api');
jest.mock('../src/handover-instructions/handoverInstruction.api');
jest.mock('../src/navigation/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn()
}));

const mockedFamilyApi = familyApi as jest.Mocked<typeof familyApi>;
const mockedContactApi = contactApi as jest.Mocked<typeof contactApi>;
const mockedAssetApi = assetApi as jest.Mocked<typeof assetApi>;
const mockedInstructionApi = handoverInstructionApi as jest.Mocked<typeof handoverInstructionApi>;

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
    email: 'sara@example.com',
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

function mockHandoverData({
  familyMembers = [],
  handoverInstruction = { message: null, firstSteps: [] },
  trustedContacts = [],
  assetReferences = []
}: {
  familyMembers?: FamilyMember[];
  handoverInstruction?: { message: string | null; firstSteps: string[] };
  trustedContacts?: TrustedContact[];
  assetReferences?: AssetReference[];
}): void {
  mockedFamilyApi.listFamilyMembers.mockResolvedValue(familyMembers);
  mockedContactApi.listTrustedContacts.mockResolvedValue(trustedContacts);
  mockedAssetApi.listAssetReferences.mockResolvedValue(assetReferences);
  mockedInstructionApi.getHandoverInstruction.mockResolvedValue(handoverInstruction);
  mockedInstructionApi.saveHandoverInstruction.mockResolvedValue(handoverInstruction);
}

afterEach(() => jest.clearAllMocks());

describe('EmergencyHandoverScreen', () => {
  it('renders the first call, backup, and findable assets', async () => {
    mockHandoverData({
      familyMembers: [makeMember()],
      handoverInstruction: {
        message: 'Take a breath, then call Sara.',
        firstSteps: ['Call Sara', 'Open Drive / Family']
      },
      trustedContacts: [makeContact(), makeContact({ id: 'c2', name: 'Nur', role: 'BACKUP' })],
      assetReferences: [makeAsset()]
    });

    render(<EmergencyHandoverScreen />);

    expect(await screen.findByText('Emergency handover')).toBeTruthy();
    expect(screen.getByText('Sara')).toBeTruthy();
    expect(screen.getByText('Nur')).toBeTruthy();
    expect(screen.getByText('Take a breath, then call Sara.')).toBeTruthy();
    expect(screen.getByText('Open Drive / Family')).toBeTruthy();
    expect(screen.getByText('Drive / Family / Banking')).toBeTruthy();
    expect(screen.getByText('Complete')).toBeTruthy();
    expect(screen.getByText('Back to completed plan')).toBeTruthy();
  });

  it('saves the planner handover message and first steps', async () => {
    mockHandoverData({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact(), makeContact({ id: 'c2', role: 'BACKUP' })],
      assetReferences: [makeAsset()]
    });
    mockedInstructionApi.saveHandoverInstruction.mockResolvedValue({
      message: 'Call Sara first.',
      firstSteps: ['Call Sara', 'Open Drive / Family']
    });

    render(<EmergencyHandoverScreen />);
    await screen.findByLabelText('Handover message');

    fireEvent.changeText(screen.getByLabelText('Handover message'), 'Call Sara first.');
    fireEvent.changeText(screen.getByLabelText('First step 1'), 'Call Sara');
    fireEvent.changeText(screen.getByLabelText('First step 2'), 'Open Drive / Family');
    fireEvent.press(screen.getByText('Save handover message'));

    await waitFor(() =>
      expect(mockedInstructionApi.saveHandoverInstruction).toHaveBeenCalledWith({
        message: 'Call Sara first.',
        firstSteps: ['Call Sara', 'Open Drive / Family']
      })
    );
  });

  it('shows privacy boundaries and gaps when data is incomplete', async () => {
    mockHandoverData({
      familyMembers: [],
      trustedContacts: [],
      assetReferences: [makeAsset({ locationHint: null })]
    });

    render(<EmergencyHandoverScreen />);

    expect(await screen.findByText('Sensitive details stay out')).toBeTruthy();
    expect(screen.getByText(/never displays account numbers, balances, passwords/)).toBeTruthy();
    expect(screen.getByText('Choose a first contact')).toBeTruthy();
    expect(screen.getByText('Needs location hints')).toBeTruthy();
  });

  it('surfaces load errors from any handover source', async () => {
    mockedFamilyApi.listFamilyMembers.mockResolvedValue([]);
    mockedContactApi.listTrustedContacts.mockRejectedValue(new Error('Network down'));
    mockedAssetApi.listAssetReferences.mockResolvedValue([]);
    mockedInstructionApi.getHandoverInstruction.mockResolvedValue({
      message: null,
      firstSteps: []
    });

    render(<EmergencyHandoverScreen />);

    expect(await screen.findByText('Network down')).toBeTruthy();
  });

  it('is exposed through the emergency handover route', async () => {
    mockHandoverData({});

    render(<EmergencyHandoverRoute />);

    expect(await screen.findByText('Emergency handover')).toBeTruthy();
  });
});
