import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderRouter, screen, testRouter } from 'expo-router/testing-library';
import { resetDevAccountAuth } from '../src/account/AccountAuthContext';
import { writeAuthModePreference } from '../src/account/authModePreference';
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
import * as emergencyApi from '../src/emergency-access/emergencyAccess.api';
import type {
  ContactAccessAssignment,
  ContactEmergencyHandover
} from '../src/emergency-access/emergencyAccess.types';
import * as contactApi from '../src/trusted-contacts/trustedContact.api';
import type {
  CreateTrustedContactInput,
  TrustedContact
} from '../src/trusted-contacts/trustedContact.types';

const mockSecureStoreData = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStoreData.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStoreData.set(key, value);
  })
}));

jest.mock('../src/family-members/familyMember.api');
jest.mock('../src/trusted-contacts/trustedContact.api');
jest.mock('../src/asset-references/assetReference.api');
jest.mock('../src/plan/planProgress.api');
jest.mock('../src/check-in/reviewSettings.api');
jest.mock('../src/handover-instructions/handoverInstruction.api');
jest.mock('../src/emergency-access/emergencyAccess.api');

const mockedFamilyApi = familyApi as jest.Mocked<typeof familyApi>;
const mockedContactApi = contactApi as jest.Mocked<typeof contactApi>;
const mockedAssetApi = assetApi as jest.Mocked<typeof assetApi>;
const mockedPlanProgressApi = planProgressApi as jest.Mocked<typeof planProgressApi>;
const mockedReviewSettingsApi = reviewSettingsApi as jest.Mocked<typeof reviewSettingsApi>;
const mockedInstructionApi = handoverInstructionApi as jest.Mocked<typeof handoverInstructionApi>;
const mockedEmergencyApi = emergencyApi as jest.Mocked<typeof emergencyApi>;

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

function makeContactAssignment(contact: TrustedContact): ContactAccessAssignment {
  return {
    id: contact.id,
    ownerUserId: 'owner-1',
    name: contact.name,
    relation: contact.relation,
    role: contact.role,
    phone: contact.phone,
    email: contact.email,
    verificationStatus: 'VERIFIED',
    planner: { id: 'owner-1', name: 'Aisyah Rahman' },
    latestRequest: null
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

function makeContactHandover(): ContactEmergencyHandover {
  const verifiedContacts = trustedContacts.filter(
    (contact) => contact.verificationStatus === 'VERIFIED'
  );
  const documentedCount = assetReferences.filter(
    (reference) => reference.locationHint
  ).length;

  return {
    instruction: handoverInstruction,
    family: familyMembers.map((member) => ({
      name: member.name,
      relation: member.relation,
      detail: null
    })),
    contacts: verifiedContacts.map((contact) => ({
      name: contact.name,
      relation: contact.relation,
      role: contact.role,
      phone: contact.phone,
      email: contact.email
    })),
    locations: assetReferences.map((reference) => ({
      name: reference.name,
      category: reference.category,
      locationHint: reference.locationHint,
      documented: Boolean(reference.locationHint)
    })),
    steps:
      handoverInstruction.firstSteps.length > 0
        ? handoverInstruction.firstSteps
        : [
            'Contact the primary trusted contact.',
            'Review family context.',
            'Locate key asset references.'
          ],
    summary: {
      contactCount: verifiedContacts.length,
      familyMemberCount: familyMembers.length,
      locationCount: assetReferences.length,
      documentedCount
    }
  };
}

function navigateTo(path: string): void {
  testRouter.push(path);
}

async function authenticate(): Promise<void> {
  await screen.findByLabelText('Email');
  await waitFor(() => {
    fireEvent.changeText(screen.getByLabelText('Email'), 'aisyah.rahman@gmail.com');
    expect(screen.getByDisplayValue('aisyah.rahman@gmail.com')).toBeTruthy();
  });
  fireEvent.press(screen.getByText('Continue with email'));
  expect(await screen.findByText('Verify and continue')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Verification code'), '123456');
  fireEvent.press(screen.getByText('Verify and continue'));
}

beforeEach(async () => {
  resetDevAccountAuth();
  mockSecureStoreData.clear();
  await writeAuthModePreference('planner');
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
  mockedContactApi.createTrustedContactInvite.mockImplementation(async (id) => {
    const updated = trustedContacts.find((contact) => contact.id === id);
    if (!updated) {
      throw new Error('Missing contact');
    }
    const invited = {
      ...updated,
      inviteSentAt: '2026-08-25T00:00:00.000Z',
      inviteTokenExpiresAt: '2099-09-08T00:00:00.000Z'
    };
    trustedContacts = trustedContacts.map((contact) =>
      contact.id === id ? invited : contact
    );
    return {
      contact: invited,
      inviteToken: 'journey-invite-token-12345678901234567890',
      expiresAt: '2099-09-08T00:00:00.000Z'
    };
  });
  mockedContactApi.bindTrustedContactInvite.mockImplementation(async (inviteToken) => {
    if (inviteToken !== 'journey-invite-token-12345678901234567890') {
      throw new Error('Invalid invite token');
    }
    const pending = trustedContacts.find(
      (contact) => contact.verificationStatus === 'PENDING'
    );
    if (!pending) {
      throw new Error('Missing pending contact');
    }
    const verified = {
      ...pending,
      verificationStatus: 'VERIFIED' as const,
      inviteTokenUsedAt: '2026-08-25T00:01:00.000Z'
    };
    trustedContacts = trustedContacts.map((contact) =>
      contact.id === verified.id ? verified : contact
    );
    return {
      id: verified.id,
      ownerUserId: 'owner-1',
      name: verified.name,
      relation: verified.relation,
      role: verified.role,
      phone: verified.phone,
      email: verified.email,
      verificationStatus: verified.verificationStatus,
      createdAt: verified.createdAt,
      updatedAt: verified.updatedAt
    };
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

  mockedEmergencyApi.getContactAccessContext.mockImplementation(async () =>
    trustedContacts
      .filter((contact) => contact.verificationStatus === 'VERIFIED')
      .map(makeContactAssignment)
  );
  mockedEmergencyApi.getContactAssignmentHandover.mockImplementation(
    async () => makeContactHandover()
  );
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

  it('invites a trusted contact and lets the contact bind into emergency mode', async () => {
    renderRouter('src/app', { initialUrl: '/trusted-contacts' });

    await authenticate();
    navigateTo('/trusted-contacts');

    expect(await screen.findByText('Who should your family turn to?')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Name'), 'Sara Abdullah');
    fireEvent.changeText(screen.getByLabelText('Phone'), '+60123456789');
    fireEvent.press(screen.getByText('Add trusted contact'));
    expect(await screen.findByText('Sara Abdullah')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Name'), 'Imran Rahman');
    fireEvent.changeText(screen.getByLabelText('Email'), 'imran@example.com');
    fireEvent.press(screen.getByText('Backup'));
    fireEvent.changeText(screen.getByLabelText('Phone'), '+60129876543');
    fireEvent.press(screen.getByText('Add trusted contact'));
    expect(await screen.findByText('Imran Rahman')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Send invite to Imran Rahman'));
    expect(await screen.findByText('journey-invite-token-12345678901234567890')).toBeTruthy();

    trustedContacts = trustedContacts.filter((contact) => contact.name === 'Imran Rahman');
    navigateTo('/contact-emergency');
    expect(await screen.findByText('No verified assignment')).toBeTruthy();

    fireEvent.changeText(
      screen.getByLabelText('Trusted contact invite token'),
      'journey-invite-token-12345678901234567890'
    );
    fireEvent.press(screen.getByText('Bind invite'));

    expect(await screen.findByText('Contact Home')).toBeTruthy();
    expect(await screen.findByText(/trusted contact for Aisyah Rahman/)).toBeTruthy();
    expect(await screen.findByText('Contacts & First Steps')).toBeTruthy();
    expect(await screen.findByText('Imran Rahman')).toBeTruthy();
    expect(mockedEmergencyApi.getContactAssignmentHandover).toHaveBeenCalledWith(
      'contact-2',
      undefined
    );
    expect(mockedEmergencyApi.createEmergencyAccessRequest).not.toHaveBeenCalled();
    expect(mockedContactApi.bindTrustedContactInvite).toHaveBeenCalledWith(
      'journey-invite-token-12345678901234567890'
    );
  }, 45000);
});
