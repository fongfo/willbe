import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { resetDevAccountAuth } from '../src/account/AccountAuthContext';
import { writeAuthModePreference } from '../src/account/authModePreference';
import * as assetApi from '../src/asset-references/assetReference.api';
import * as emergencyApi from '../src/emergency-access/emergencyAccess.api';
import * as familyApi from '../src/family-members/familyMember.api';
import * as planProgressApi from '../src/plan/planProgress.api';
import * as contactApi from '../src/trusted-contacts/trustedContact.api';

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
jest.mock('../src/emergency-access/emergencyAccess.api');

jest.setTimeout(15000);

const mockedFamilyApi = familyApi as jest.Mocked<typeof familyApi>;
const mockedContactApi = contactApi as jest.Mocked<typeof contactApi>;
const mockedAssetApi = assetApi as jest.Mocked<typeof assetApi>;
const mockedPlanProgressApi = planProgressApi as jest.Mocked<typeof planProgressApi>;
const mockedEmergencyApi = emergencyApi as jest.Mocked<typeof emergencyApi>;

beforeEach(async () => {
  resetDevAccountAuth();
  mockSecureStoreData.clear();
  await writeAuthModePreference('planner');
  mockedFamilyApi.listFamilyMembers.mockResolvedValue([]);
  mockedContactApi.listTrustedContacts.mockResolvedValue([]);
  mockedAssetApi.listAssetReferences.mockResolvedValue([]);
  mockedPlanProgressApi.getPlanProgress.mockResolvedValue({
    completedSetupSteps: 0,
    hasFamilyMembers: false,
    hasTrustedContacts: false,
    hasAssetReferences: false,
    hasCheckInSetup: false
  });
  mockedEmergencyApi.getContactAccessContext.mockResolvedValue([]);
});

afterEach(() => jest.clearAllMocks());

describe('app navigation skeleton', () => {
  async function authenticate(): Promise<void> {
    fireEvent.changeText(await screen.findByLabelText('Email'), 'aisyah.rahman@gmail.com');
    fireEvent.press(screen.getByText('Continue with email'));
    expect(await screen.findByText('Verify and continue')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Verification code'), '123456');
    fireEvent.press(screen.getByText('Verify and continue'));
    await screen.findByText('Preparedness score');
  }

  it('redirects the root route to auth when there is no session', async () => {
    const router = renderRouter('src/app', { initialUrl: '/' });

    expect(await screen.findByText('Protect your family plan')).toBeTruthy();
    await waitFor(() => {
      expect(router.getPathname()).toBe('/auth');
    });
  });

  it('enters the Home tab after email code auth', async () => {
    const router = renderRouter('src/app', { initialUrl: '/' });

    await authenticate();

    await waitFor(() => {
      expect(router.getPathname()).toBe('/home');
    });
    expect(screen.getByText('Preparedness score')).toBeTruthy();
  });

  it('keeps emergency contact sign-in in contact emergency mode', async () => {
    const router = renderRouter('src/app', { initialUrl: '/auth' });

    fireEvent.press(screen.getByText('I am an emergency contact'));
    fireEvent.changeText(screen.getByLabelText('Email'), 'imran@example.com');
    fireEvent.press(screen.getByText('Continue with email'));
    expect(await screen.findByText('Verify and continue')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Verification code'), '123456');
    fireEvent.press(screen.getByText('Verify and continue'));

    expect(await screen.findByText('Emergency mode')).toBeTruthy();
    await waitFor(() => {
      expect(router.getPathname()).toBe('/contact-emergency');
    });
  });

  it('navigates between the bottom tabs', async () => {
    const router = renderRouter('src/app', { initialUrl: '/home' });

    await authenticate();

    await act(async () => {
      fireEvent.press(screen.getByText('AI'));
    });

    expect(router.getPathname()).toBe('/assistant');
    expect(screen.getByText('AI assistant')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('Account'));
    });

    expect(router.getPathname()).toBe('/account');
  });

});
