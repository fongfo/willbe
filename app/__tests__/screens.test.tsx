import { render, screen } from '@testing-library/react-native';

import PlaceholderScreen from '../src/screens/PlaceholderScreen';
import HomeScreen from '../src/app/(tabs)/home';
import PlanScreen from '../src/app/(tabs)/plan';
import ReadinessScreen from '../src/app/(tabs)/readiness';
import { AccountAuthProvider, resetDevAccountAuth } from '../src/account/AccountAuthContext';
import { AccountCenterView } from '../src/account/AccountScreen';
import AuthScreen from '../src/app/auth';
import ConsentScreen from '../src/app/consent';
import * as assetApi from '../src/asset-references/assetReference.api';
import * as familyApi from '../src/family-members/familyMember.api';
import * as gapApi from '../src/readiness/gapExplanations.api';
import * as contactApi from '../src/trusted-contacts/trustedContact.api';

jest.mock('../src/family-members/familyMember.api');
jest.mock('../src/trusted-contacts/trustedContact.api');
jest.mock('../src/asset-references/assetReference.api');
jest.mock('../src/readiness/gapExplanations.api');

const mockedFamilyApi = familyApi as jest.Mocked<typeof familyApi>;
const mockedContactApi = contactApi as jest.Mocked<typeof contactApi>;
const mockedAssetApi = assetApi as jest.Mocked<typeof assetApi>;
const mockedGapApi = gapApi as jest.Mocked<typeof gapApi>;

beforeEach(() => {
  resetDevAccountAuth();
  mockedFamilyApi.listFamilyMembers.mockResolvedValue([]);
  mockedContactApi.listTrustedContacts.mockResolvedValue([]);
  mockedAssetApi.listAssetReferences.mockResolvedValue([]);
  mockedGapApi.explainGaps.mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => jest.clearAllMocks());

describe('PlaceholderScreen', () => {
  it('renders the provided title', () => {
    render(<PlaceholderScreen title="My Title" />);

    expect(screen.getByText('My Title')).toBeTruthy();
  });

  it('renders an optional subtitle', () => {
    render(<PlaceholderScreen title="Title" subtitle="Coming soon" />);

    expect(screen.getByText('Coming soon')).toBeTruthy();
  });
});

describe('tab + stack screens', () => {
  it.each([
    [PlanScreen, 'Plan'],
    [ConsentScreen, 'Consent'],
  ])('renders the %s screen heading', (Screen, heading) => {
    render(<Screen />);

    expect(screen.getByText(heading)).toBeTruthy();
  });

  it('renders the Auth screen heading', () => {
    render(
      <AccountAuthProvider>
        <AuthScreen />
      </AccountAuthProvider>
    );

    expect(screen.getByText('Protect your family plan')).toBeTruthy();
  });

  it('renders the authenticated Account center heading', () => {
    render(
      <AccountCenterView
        onSignOut={() => undefined}
        user={{
          id: 'user-1',
          privyUserId: 'did:privy:user-1',
          email: 'aisyah.rahman@gmail.com',
          name: null,
          walletAddress: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
        }}
        walletStatus="ready"
      />
    );

    expect(screen.getByText('Account')).toBeTruthy();
  });

  it('renders the Home dashboard heading after loading data', async () => {
    render(<HomeScreen />);

    expect(await screen.findByText('Home')).toBeTruthy();
    expect(screen.getByText('Preparedness score')).toBeTruthy();
  });

  it('renders the Readiness screen heading after loading data', async () => {
    render(<ReadinessScreen />);

    expect(await screen.findByText('Readiness')).toBeTruthy();
  });
});
