import { act, render, screen, waitFor } from '@testing-library/react-native';
import ReadinessRoute from '../src/app/(tabs)/readiness';
import ReadinessScreen from '../src/readiness/ReadinessScreen';
import * as assetApi from '../src/asset-references/assetReference.api';
import type { AssetReference } from '../src/asset-references/assetReference.types';
import * as familyApi from '../src/family-members/familyMember.api';
import type { FamilyMember } from '../src/family-members/familyMember.types';
import * as gapApi from '../src/readiness/gapExplanations.api';
import type { GapExplanationResponse } from '../src/readiness/gapExplanations.types';
import * as contactApi from '../src/trusted-contacts/trustedContact.api';
import type { TrustedContact } from '../src/trusted-contacts/trustedContact.types';

jest.mock('../src/family-members/familyMember.api');
jest.mock('../src/trusted-contacts/trustedContact.api');
jest.mock('../src/asset-references/assetReference.api');
jest.mock('../src/readiness/gapExplanations.api');
jest.mock('../src/navigation/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn()
}));

const mockedFamilyApi = familyApi as jest.Mocked<typeof familyApi>;
const mockedContactApi = contactApi as jest.Mocked<typeof contactApi>;
const mockedAssetApi = assetApi as jest.Mocked<typeof assetApi>;
const mockedGapApi = gapApi as jest.Mocked<typeof gapApi>;

const explanation: GapExplanationResponse = {
  summary: 'Add one more trusted contact before recording asset references.',
  recommendations: [
    {
      gapId: 'trusted-contacts-count',
      category: 'trusted_contacts',
      priority: 20,
      urgency: 'do_first',
      title: 'Add two trusted contacts',
      explanation: 'A backup contact gives your family another person to call.',
      nextAction: { label: 'Add trusted contact', route: '/trusted-contacts' }
    },
    {
      gapId: 'asset-references',
      category: 'asset_references',
      priority: 40,
      urgency: 'do_next',
      title: 'Add an asset reference',
      explanation: 'An asset reference tells your family where to start without storing account numbers.',
      nextAction: { label: 'Add asset reference', route: '/asset-references' }
    }
  ],
  disclaimerRequired: true,
  answerPolicy: {
    responseMode: 'structured_gap_explanation_only',
    prohibitedAdvice: ['financial', 'legal', 'insurance']
  },
  provider: {
    name: 'deepseek',
    model: 'deepseek-v4-flash'
  }
};

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

beforeEach(() => {
  mockedGapApi.explainGaps.mockImplementation(
    () => new Promise<GapExplanationResponse>(() => undefined)
  );
});

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
    expect(mockedGapApi.explainGaps).not.toHaveBeenCalled();
  }, 30000);

  it('lists actionable gaps for an incomplete plan', async () => {
    let resolveExplanation: (value: GapExplanationResponse) => void = () => undefined;
    mockedGapApi.explainGaps.mockImplementation(
      () => new Promise<GapExplanationResponse>((resolve) => {
        resolveExplanation = resolve;
      })
    );
    mockReadinessData({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact()],
      assetReferences: []
    });

    render(<ReadinessScreen />);

    expect(await screen.findByText('40')).toBeTruthy();
    await waitFor(() => expect(mockedGapApi.explainGaps).toHaveBeenCalled());
    await act(async () => resolveExplanation(explanation));
    expect(await screen.findByText('Priority plan')).toBeTruthy();
    expect(screen.getByText(explanation.summary)).toBeTruthy();
    expect(screen.getByText('Do first')).toBeTruthy();
    expect(screen.getByText(/Product guidance only/)).toBeTruthy();
    expect(screen.getAllByText('Add two trusted contacts').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Add an asset reference').length).toBeGreaterThanOrEqual(1);
    expect(mockedGapApi.explainGaps).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 40,
        gaps: expect.arrayContaining([
          expect.objectContaining({
            id: 'trusted-contacts-count',
            evidence: { current: 1, required: 2, unit: 'trusted contacts' }
          })
        ])
      }),
      expect.any(AbortSignal)
    );
    expect(JSON.stringify(mockedGapApi.explainGaps.mock.calls[0])).not.toContain('Maybank');
  });

  it('shows a gap analysis error while preserving the deterministic gap list', async () => {
    let rejectExplanation: (error: Error) => void = () => undefined;
    mockedGapApi.explainGaps.mockImplementation(
      () => new Promise<GapExplanationResponse>((_resolve, reject) => {
        rejectExplanation = reject;
      })
    );
    mockReadinessData({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact()],
      assetReferences: []
    });

    render(<ReadinessScreen />);

    await waitFor(() => expect(mockedGapApi.explainGaps).toHaveBeenCalled());
    await act(async () => rejectExplanation(new Error('Gap analysis unavailable')));
    expect(await screen.findByText('Gap analysis unavailable')).toBeTruthy();
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
