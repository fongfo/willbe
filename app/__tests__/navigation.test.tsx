import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import * as assetApi from '../src/asset-references/assetReference.api';
import * as familyApi from '../src/family-members/familyMember.api';
import * as contactApi from '../src/trusted-contacts/trustedContact.api';

jest.mock('../src/family-members/familyMember.api');
jest.mock('../src/trusted-contacts/trustedContact.api');
jest.mock('../src/asset-references/assetReference.api');

jest.setTimeout(15000);

const mockedFamilyApi = familyApi as jest.Mocked<typeof familyApi>;
const mockedContactApi = contactApi as jest.Mocked<typeof contactApi>;
const mockedAssetApi = assetApi as jest.Mocked<typeof assetApi>;

beforeEach(() => {
  mockedFamilyApi.listFamilyMembers.mockResolvedValue([]);
  mockedContactApi.listTrustedContacts.mockResolvedValue([]);
  mockedAssetApi.listAssetReferences.mockResolvedValue([]);
});

afterEach(() => jest.clearAllMocks());

describe('app navigation skeleton', () => {
  it('redirects the root route to the Home tab', async () => {
    const router = renderRouter('src/app', { initialUrl: '/' });

    await act(async () => {});

    expect(router.getPathname()).toBe('/home');
    // Home tab label and screen title both read "Home"; assert on unique dashboard copy.
    expect(await screen.findByText('Preparedness score')).toBeTruthy();
  });

  it('navigates between the bottom tabs', async () => {
    const router = renderRouter('src/app', { initialUrl: '/home' });

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

  it('exposes the consent screen', async () => {
    const router = renderRouter('src/app', { initialUrl: '/consent' });

    await act(async () => {});

    expect(router.getPathname()).toBe('/consent');
    expect(screen.getByText('Consent')).toBeTruthy();
  });
});
