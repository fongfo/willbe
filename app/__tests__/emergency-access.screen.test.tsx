import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useAccountAuth } from '../src/account/AccountAuthContext';
import ContactEmergencyRoute from '../src/app/contact-emergency';
import * as emergencyApi from '../src/emergency-access/emergencyAccess.api';
import ContactEmergencyModeScreen from '../src/emergency-access/ContactEmergencyModeScreen';
import type {
  ContactAccessAssignment,
  ContactEmergencyHandover,
  EmergencyAccessRequestSummary
} from '../src/emergency-access/emergencyAccess.types';
import * as trustedContactApi from '../src/trusted-contacts/trustedContact.api';

jest.mock('../src/emergency-access/emergencyAccess.api');
jest.mock('../src/trusted-contacts/trustedContact.api');
jest.mock('../src/account/AccountAuthContext', () => ({
  useAccountAuth: jest.fn()
}));

const mockedUseAccountAuth = useAccountAuth as jest.MockedFunction<typeof useAccountAuth>;
const mockedEmergencyApi = emergencyApi as jest.Mocked<typeof emergencyApi>;
const mockedTrustedContactApi = trustedContactApi as jest.Mocked<typeof trustedContactApi>;
const signOut = jest.fn().mockResolvedValue(undefined);

const coolingOffRequest: EmergencyAccessRequestSummary = {
  id: 'req1',
  status: 'COOLING_OFF',
  reason: 'UNREACHABLE',
  reasonDetail: null,
  coolingOffEndsAt: '2026-08-20T00:00:00.000Z',
  activatedAt: null,
  expiresAt: null,
  closedAt: null,
  createdAt: '2026-08-19T00:00:00.000Z'
};
const activeExpiresAt = '2026-09-22T01:00:00.000Z';

function makeAssignment(
  latestRequest: EmergencyAccessRequestSummary | null = null
): ContactAccessAssignment {
  return {
    id: 'tc1',
    ownerUserId: 'owner-1',
    name: 'Imran Rahman',
    relation: 'SPOUSE',
    role: 'PRIMARY',
    phone: '+60123456789',
    email: 'imran@example.com',
    verificationStatus: 'VERIFIED',
    planner: { id: 'owner-1', name: 'Aisyah Rahman' },
    latestRequest
  };
}

function makeHandover(): ContactEmergencyHandover {
  return {
    instruction: { message: 'Take a breath, then call Sara.', firstSteps: ['Call Sara'] },
    family: [{ name: 'Amina Rahman', relation: 'CHILD', detail: null }],
    contacts: [
      {
        name: 'Sara Abdullah',
        relation: 'SIBLING',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'sara@example.com'
      }
    ],
    locations: [
      {
        name: 'Maybank folder',
        category: 'BANK',
        locationHint: 'Drive / Family / Banking',
        documented: true
      }
    ],
    steps: ['Call Sara', 'Open Drive / Family'],
    summary: {
      contactCount: 1,
      familyMemberCount: 1,
      locationCount: 1,
      documentedCount: 1
    }
  };
}

beforeEach(() => {
  mockedEmergencyApi.getContactAssignmentHandover.mockResolvedValue(makeHandover());
  mockedUseAccountAuth.mockReturnValue({
    status: 'authenticated',
    authMode: 'contact',
    authModeReady: true,
    user: {
      id: 'dev-user-1',
      privyUserId: 'dev:imran@example.com',
      email: 'imran@example.com',
      name: null,
      walletAddress: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
    },
    error: null,
    walletStatus: 'ready',
    walletError: null,
    setAuthMode: jest.fn().mockResolvedValue(undefined),
    sendEmailCode: jest.fn().mockResolvedValue(undefined),
    verifyEmailCode: jest.fn().mockResolvedValue(undefined),
    retryWalletSync: jest.fn().mockResolvedValue(undefined),
    signOut
  });
});

afterEach(() => jest.clearAllMocks());

describe('ContactEmergencyModeScreen', () => {
  it('shows contact home and directly loads planner handover', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([makeAssignment()]);

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Contact Home')).toBeTruthy();
    expect(await screen.findByText(/trusted contact for Aisyah Rahman/)).toBeTruthy();
    expect(await screen.findByText('Contacts & First Steps')).toBeTruthy();
    expect(screen.getByText('Take a breath, then call Sara.')).toBeTruthy();
    expect(screen.queryByText('Request Emergency Access')).toBeNull();
    expect(mockedEmergencyApi.getContactAssignmentHandover).toHaveBeenCalledWith(
      'tc1',
      expect.any(AbortSignal)
    );
    expect(mockedEmergencyApi.createEmergencyAccessRequest).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Sign out'));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('shows a handover loading error without showing a request form', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([makeAssignment()]);
    mockedEmergencyApi.getContactAssignmentHandover.mockRejectedValue(
      new Error('Unable to load handover')
    );

    render(<ContactEmergencyModeScreen />);

    await screen.findByText('Contact Home');
    expect(await screen.findByText('Unable to load handover')).toBeTruthy();
    expect(screen.queryByText('Request emergency access')).toBeNull();
  });

  it('shows waiting state while still exposing verified handover', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([
      makeAssignment(coolingOffRequest)
    ]);

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Waiting for Review')).toBeTruthy();
    expect(await screen.findByText('Where to Look')).toBeTruthy();
    expect(mockedEmergencyApi.getContactEmergencyHandover).not.toHaveBeenCalled();
    expect(mockedEmergencyApi.getContactAssignmentHandover).toHaveBeenCalledWith(
      'tc1',
      expect.any(AbortSignal)
    );
  });

  it('lets a backup contact confirm secondary review and enters emergency mode', async () => {
    const secondaryReviewRequest: EmergencyAccessRequestSummary = {
      ...coolingOffRequest,
      status: 'SECONDARY_REVIEW',
      reviewRole: 'BACKUP_REVIEWER'
    };
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([
      {
        ...makeAssignment(secondaryReviewRequest),
        role: 'BACKUP'
      }
    ]);
    mockedEmergencyApi.confirmBackupEmergencyAccessRequest.mockResolvedValue({
      ...secondaryReviewRequest,
      status: 'ACTIVE',
      activatedAt: '2026-08-19T01:00:00.000Z',
      expiresAt: activeExpiresAt
    });
    mockedEmergencyApi.getContactEmergencyHandover.mockResolvedValue(makeHandover());

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Backup Confirmation')).toBeTruthy();
    fireEvent.press(screen.getByText('Confirm and activate'));

    await waitFor(() =>
      expect(mockedEmergencyApi.confirmBackupEmergencyAccessRequest).toHaveBeenCalledWith('req1')
    );
    expect(await screen.findByText('Contacts & First Steps')).toBeTruthy();
  });

  it('lets a backup contact deny secondary review', async () => {
    const secondaryReviewRequest: EmergencyAccessRequestSummary = {
      ...coolingOffRequest,
      status: 'SECONDARY_REVIEW',
      reviewRole: 'BACKUP_REVIEWER'
    };
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([
      {
        ...makeAssignment(secondaryReviewRequest),
        role: 'BACKUP'
      }
    ]);
    mockedEmergencyApi.denyBackupEmergencyAccessRequest.mockResolvedValue({
      ...secondaryReviewRequest,
      status: 'DENIED',
      closedAt: '2026-08-19T01:00:00.000Z'
    });

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Backup Confirmation')).toBeTruthy();
    fireEvent.press(screen.getByText('Deny request'));

    await waitFor(() =>
      expect(mockedEmergencyApi.denyBackupEmergencyAccessRequest).toHaveBeenCalledWith('req1')
    );
    expect(await screen.findByText('Request denied')).toBeTruthy();
  });

  it('does not show backup confirmation for the requesting backup contact', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([
      {
        ...makeAssignment({
          ...coolingOffRequest,
          status: 'SECONDARY_REVIEW',
          reviewRole: 'REQUESTER'
        }),
        role: 'BACKUP'
      }
    ]);

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Waiting for Review')).toBeTruthy();
    expect(screen.queryByText('Backup Confirmation')).toBeNull();
  });

  it('shows active contacts, first steps, family context, locations, and close action', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([
      makeAssignment({
        ...coolingOffRequest,
        status: 'ACTIVE',
        activatedAt: '2026-08-19T01:00:00.000Z',
        expiresAt: activeExpiresAt
      })
    ]);
    mockedEmergencyApi.getContactEmergencyHandover.mockResolvedValue(makeHandover());
    mockedEmergencyApi.closeEmergencyAccessRequest.mockResolvedValue({
      ...coolingOffRequest,
      status: 'CLOSED',
      closedAt: '2026-08-19T02:00:00.000Z'
    });

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Contacts & First Steps')).toBeTruthy();
    expect(screen.getByText('Take a breath, then call Sara.')).toBeTruthy();
    expect(screen.getByText('Amina Rahman')).toBeTruthy();
    expect(screen.getByText('Drive / Family / Banking')).toBeTruthy();
    fireEvent.press(screen.getByText('Close emergency access'));

    await waitFor(() =>
      expect(mockedEmergencyApi.closeEmergencyAccessRequest).toHaveBeenCalledWith('req1')
    );
    expect(await screen.findByText('Access closed')).toBeTruthy();
  });

  it('lets a contact switch between multiple planner assignments', async () => {
    const activeRequest: EmergencyAccessRequestSummary = {
      ...coolingOffRequest,
      id: 'req2',
      status: 'ACTIVE',
      activatedAt: '2026-08-19T01:00:00.000Z',
      expiresAt: activeExpiresAt
    };
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([
      makeAssignment(null),
      {
        ...makeAssignment(activeRequest),
        id: 'tc2',
        ownerUserId: 'owner-2',
        planner: { id: 'owner-2', name: 'Budi Rahman' }
      }
    ]);
    mockedEmergencyApi.getContactEmergencyHandover.mockResolvedValue(makeHandover());

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Budi Rahman')).toBeTruthy();
    fireEvent.press(screen.getByText('Budi Rahman'));

    expect(await screen.findByText('Contacts & First Steps')).toBeTruthy();
    expect(
      mockedEmergencyApi.getContactEmergencyHandover.mock.calls.some(
        ([requestId]) => requestId === 'req2'
      )
    ).toBe(true);
  });

  it('shows invite token binding from the contact home state', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([makeAssignment()]);
    mockedTrustedContactApi.bindTrustedContactInvite.mockResolvedValue({
      id: 'tc2',
      ownerUserId: 'owner-2',
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'BACKUP',
      phone: '+60123456789',
      email: 'imran@example.com',
      verificationStatus: 'VERIFIED',
      createdAt: '2026-08-25T00:00:00.000Z',
      updatedAt: '2026-08-25T00:00:00.000Z'
    });

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Contact Home')).toBeTruthy();
    expect(screen.getByText('Bind Invite Token')).toBeTruthy();
    fireEvent.changeText(
      screen.getByLabelText('Trusted contact invite token'),
      'another-token-12345678901234567890'
    );
    fireEvent.press(screen.getByText('Bind invite'));

    await waitFor(() =>
      expect(mockedTrustedContactApi.bindTrustedContactInvite).toHaveBeenCalledWith(
        'another-token-12345678901234567890'
      )
    );
  });

  it('shows terminal expired state and still fetches verified handover', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([
      makeAssignment({ ...coolingOffRequest, status: 'EXPIRED' })
    ]);

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Access expired')).toBeTruthy();
    expect(await screen.findByText('Where to Look')).toBeTruthy();
    expect(mockedEmergencyApi.getContactEmergencyHandover).not.toHaveBeenCalled();
    expect(mockedEmergencyApi.getContactAssignmentHandover).toHaveBeenCalledWith(
      'tc1',
      expect.any(AbortSignal)
    );
  });

  it('shows unauthorized contact state', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([]);

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('No verified assignment')).toBeTruthy();
  });

  it('binds an invite token from the no-assignment state and loads contact home', async () => {
    let bound = false;
    mockedEmergencyApi.getContactAccessContext.mockImplementation(async () =>
      bound ? [makeAssignment()] : []
    );
    mockedTrustedContactApi.bindTrustedContactInvite.mockImplementation(async () => {
      bound = true;
      return {
      id: 'tc1',
      ownerUserId: 'owner-1',
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789',
      email: 'imran@example.com',
      verificationStatus: 'VERIFIED',
      createdAt: '2026-08-25T00:00:00.000Z',
      updatedAt: '2026-08-25T00:00:00.000Z'
      };
    });

    render(<ContactEmergencyModeScreen />);
    expect(await screen.findByText('No verified assignment')).toBeTruthy();

    fireEvent.changeText(
      screen.getByLabelText('Trusted contact invite token'),
      'one-time-token-12345678901234567890'
    );
    fireEvent.press(screen.getByText('Bind invite'));

    await waitFor(() =>
      expect(mockedTrustedContactApi.bindTrustedContactInvite).toHaveBeenCalledWith(
        'one-time-token-12345678901234567890'
      )
    );
    expect(await screen.findByText('Contact Home')).toBeTruthy();
    expect(await screen.findByText(/trusted contact for Aisyah Rahman/)).toBeTruthy();
    expect(await screen.findByText('Contacts & First Steps')).toBeTruthy();
  });

  it('is exposed through the contact emergency route', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([]);

    render(<ContactEmergencyRoute />);

    expect(await screen.findByText('Emergency mode')).toBeTruthy();
  });
});
