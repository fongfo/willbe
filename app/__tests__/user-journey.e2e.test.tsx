import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, testRouter } from 'expo-router/testing-library';
import { resetDevAccountAuth } from '../src/account/AccountAuthContext';
import * as assetApi from '../src/asset-references/assetReference.api';
import type {
  AssetReference,
  CreateAssetReferenceInput
} from '../src/asset-references/assetReference.types';
import * as familyApi from '../src/family-members/familyMember.api';
import type {
  CreateFamilyMemberInput,
  FamilyMember
} from '../src/family-members/familyMember.types';
import * as planProgressApi from '../src/plan/planProgress.api';
import * as reviewSettingsApi from '../src/check-in/reviewSettings.api';
import * as handoverInstructionApi from '../src/handover-instructions/handoverInstruction.api';
import type { HandoverInstruction } from '../src/handover-instructions/handoverInstruction.types';
import * as contactApi from '../src/trusted-contacts/trustedContact.api';
import type {
  CreateTrustedContactInput,
  TrustedContact
} from '../src/trusted-contacts/trustedContact.types';

jest.mock('../src/family-members/familyMember.api');
jest.mock('../src/trusted-contacts/trustedContact.api');
jest.mock('../src/asset-references/assetReference.api');
jest.mock('../src/plan/planProgress.api');
jest.mock('../src/check-in/reviewSettings.api');
jest.mock('../src/handover-instructions/handoverInstruction.api');

const mockedFamilyApi = familyApi as jest.Mocked<typeof familyApi>;
const mockedContactApi = contactApi as jest.Mocked<typeof contactApi>;
const mockedAssetApi = assetApi as jest.Mocked<typeof assetApi>;
const mockedPlanProgressApi = planProgressApi as jest.Mocked<typeof planProgressApi>;
const mockedReviewSettingsApi = reviewSettingsApi as jest.Mocked<typeof reviewSettingsApi>;
const mockedInstructionApi = handoverInstructionApi as jest.Mocked<typeof handoverInstructionApi>;

let familyMembers: FamilyMember[] = [];
let trustedContacts: TrustedContact[] = [];
let assetReferences: AssetReference[] = [];
let hasCheckInSetup = false;
let handoverInstruction: HandoverInstruction = {
  message: null,
  firstSteps: []
};

function makeMember(
  input: CreateFamilyMemberInput,
  index: number
): FamilyMember {
  return {
    id: `family-${index}`,
    name: input.name,
    relation: input.relation,
    detail: input.detail ?? null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z'
  };
}

function makeContact(
  input: CreateTrustedContactInput,
  index: number
): TrustedContact {
  return {
    id: `contact-${index}`,
    name: input.name,
    relation: input.relation,
    role: input.role,
    phone: input.phone,
    email: input.email ?? null,
    verificationStatus: index === 1 ? 'VERIFIED' : 'PENDING',
    detail: input.detail ?? null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z'
  };
}

function makeAsset(
  input: CreateAssetReferenceInput,
  index: number
): AssetReference {
  return {
    id: `asset-${index}`,
    name: input.name,
    category: input.category,
    locationHint: input.locationHint ?? null,
    detail: input.detail ?? null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z'
  };
}

function navigateTo(path: string): void {
  testRouter.push(path);
}

async function authenticate(): Promise<void> {
  fireEvent.changeText(screen.getByLabelText('Email'), 'aisyah.rahman@gmail.com');
  fireEvent.press(screen.getByText('Continue with email'));
  expect(await screen.findByText('Verify and continue')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Verification code'), '123456');
  fireEvent.press(screen.getByText('Verify and continue'));
}

beforeEach(() => {
  resetDevAccountAuth();
  familyMembers = [];
  trustedContacts = [];
  assetReferences = [];
  hasCheckInSetup = false;
  handoverInstruction = {
    message: null,
    firstSteps: []
  };

  mockedFamilyApi.listFamilyMembers.mockImplementation(async () => familyMembers);
  mockedFamilyApi.createFamilyMember.mockImplementation(async (input) => {
    const created = makeMember(input, familyMembers.length + 1);
    familyMembers = [...familyMembers, created];
    return created;
  });

  mockedContactApi.listTrustedContacts.mockImplementation(async () => trustedContacts);
  mockedContactApi.createTrustedContact.mockImplementation(async (input) => {
    const created = makeContact(input, trustedContacts.length + 1);
    trustedContacts = [...trustedContacts, created];
    return created;
  });

  mockedAssetApi.listAssetReferences.mockImplementation(async () => assetReferences);
  mockedAssetApi.createAssetReference.mockImplementation(async (input) => {
    const created = makeAsset(input, assetReferences.length + 1);
    assetReferences = [...assetReferences, created];
    return created;
  });

  mockedPlanProgressApi.getPlanProgress.mockImplementation(async () => ({
    completedSetupSteps: [
      familyMembers.length > 0,
      trustedContacts.length > 0,
      assetReferences.length > 0,
      hasCheckInSetup
    ].filter(Boolean).length,
    hasFamilyMembers: familyMembers.length > 0,
    hasTrustedContacts: trustedContacts.length > 0,
    hasAssetReferences: assetReferences.length > 0,
    hasCheckInSetup
  }));

  mockedReviewSettingsApi.getReviewSetting.mockImplementation(async () => ({
    checkInFrequency: 'EVERY_6_MONTHS',
    connectedProviders: hasCheckInSetup ? ['ICLOUD'] : []
  }));
  mockedReviewSettingsApi.saveReviewSetting.mockImplementation(async (input) => {
    hasCheckInSetup = input.connectedProviders.length > 0;
    return input;
  });

  mockedInstructionApi.getHandoverInstruction.mockImplementation(
    async () => handoverInstruction
  );
  mockedInstructionApi.saveHandoverInstruction.mockImplementation(async (input) => {
    handoverInstruction = {
      message: input.message ?? null,
      firstSteps: input.firstSteps
    };
    return handoverInstruction;
  });
});

afterEach(() => jest.clearAllMocks());

describe('Pusaka E2E user journey', () => {
  it('goes from empty dashboard to readiness report and emergency handover preview', async () => {
    const router = renderRouter('src/app', { initialUrl: '/home' });

    await authenticate();

    expect(await screen.findByText('Preparedness score')).toBeTruthy();
    expect(screen.getByText('0/5 checks')).toBeTruthy();

    fireEvent.press(screen.getByText('View plan'));
    expect(await screen.findByText('Setup checklist')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Open step 1: Family members'));
    expect(await screen.findByText('Your family directory')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Name'), 'Amina Rahman');
    fireEvent.changeText(screen.getByLabelText('Detail'), 'Petaling Jaya');
    fireEvent.press(screen.getByText('Add family member'));
    expect(await screen.findByText('Amina Rahman')).toBeTruthy();

    navigateTo('/plan');
    fireEvent.press(screen.getByLabelText('Open step 2: Trusted contacts'));
    expect(await screen.findByText('Who should your family turn to?')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Name'), 'Sara Abdullah');
    fireEvent.changeText(screen.getByLabelText('Phone'), '+60123456789');
    fireEvent.press(screen.getByText('Add trusted contact'));
    expect(await screen.findByText('Sara Abdullah')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Name'), 'Imran Rahman');
    fireEvent.press(screen.getByText('Backup'));
    fireEvent.changeText(screen.getByLabelText('Phone'), '+60129876543');
    fireEvent.press(screen.getByText('Add trusted contact'));
    expect(await screen.findByText('Imran Rahman')).toBeTruthy();

    navigateTo('/plan');
    fireEvent.press(screen.getByLabelText('Open step 3: Asset references'));
    expect(await screen.findByText('What would your family need to find?')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Banking category'));
    fireEvent.press(screen.getByText('Next'));
    fireEvent.changeText(screen.getByLabelText('Name'), 'Maybank main account');
    fireEvent.changeText(
      screen.getByLabelText('Where to look'),
      'Drive / Family / Banking'
    );
    fireEvent.press(screen.getByText('Add reference'));
    expect(await screen.findByText('Maybank main account')).toBeTruthy();

    navigateTo('/plan');
    fireEvent.press(screen.getByLabelText('Open step 4: Check-in and cloud'));
    expect(await screen.findByText('Keep the plan fresh')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Monthly check-in frequency'));
    fireEvent.press(screen.getByLabelText('iCloud Drive cloud provider'));
    fireEvent.press(screen.getByText('Connect iCloud Drive'));
    expect(screen.getByText(/Next review cadence: Monthly/)).toBeTruthy();
    expect(screen.getByText(/Connected to iCloud Drive/)).toBeTruthy();

    navigateTo('/home');
    expect(await screen.findByText('100')).toBeTruthy();
    expect(screen.getByText('Plan complete')).toBeTruthy();
    expect(screen.getByText('Preview handover')).toBeTruthy();

    navigateTo('/readiness');
    expect(await screen.findByText('No critical gaps right now')).toBeTruthy();
    expect(screen.getByText('5 of 5 core checks complete')).toBeTruthy();

    navigateTo('/emergency-handover');
    expect(await screen.findByText('Complete')).toBeTruthy();
    expect(screen.getByText('Amina Rahman')).toBeTruthy();
    expect(screen.getByText('Sara Abdullah')).toBeTruthy();
    expect(screen.getByText('Maybank main account')).toBeTruthy();
    expect(router.getPathname()).toBe('/emergency-handover');
  }, 45000);
});
