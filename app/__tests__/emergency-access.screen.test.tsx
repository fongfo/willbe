import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ContactEmergencyRoute from '../src/app/contact-emergency';
import * as emergencyApi from '../src/emergency-access/emergencyAccess.api';
import ContactEmergencyModeScreen from '../src/emergency-access/ContactEmergencyModeScreen';
import type {
  ContactAccessAssignment,
  ContactEmergencyHandover,
  EmergencyAccessRequestSummary
} from '../src/emergency-access/emergencyAccess.types';

jest.mock('../src/emergency-access/emergencyAccess.api');

const mockedEmergencyApi = emergencyApi as jest.Mocked<typeof emergencyApi>;

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

afterEach(() => jest.clearAllMocks());

describe('ContactEmergencyModeScreen', () => {
  it('shows contact home and starts a request flow', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([makeAssignment()]);
    mockedEmergencyApi.createEmergencyAccessRequest.mockResolvedValue(coolingOffRequest);

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Contact Home')).toBeTruthy();
    expect(await screen.findByText(/trusted contact for Aisyah Rahman/)).toBeTruthy();
    fireEvent.press(screen.getByText('Request emergency access'));
    fireEvent.changeText(
      screen.getByLabelText('Emergency access reason detail'),
      'Aisyah has been unreachable.'
    );
    fireEvent.press(screen.getByText(/I confirm this is an emergency/));
    fireEvent.press(screen.getByText('Send access request'));

    await waitFor(() =>
      expect(mockedEmergencyApi.createEmergencyAccessRequest).toHaveBeenCalledWith({
        ownerUserId: 'owner-1',
        trustedContactId: 'tc1',
        reason: 'UNREACHABLE',
        reasonDetail: 'Aisyah has been unreachable.',
        confirmed: true
      })
    );
    expect(await screen.findByText('Waiting for Review')).toBeTruthy();
  });

  it('keeps the request form open when submission fails', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([makeAssignment()]);
    mockedEmergencyApi.createEmergencyAccessRequest.mockRejectedValue(
      new Error('Unable to create request')
    );

    render(<ContactEmergencyModeScreen />);

    await screen.findByText('Contact Home');
    fireEvent.press(screen.getByText('Request emergency access'));
    fireEvent.press(screen.getByText(/I confirm this is an emergency/));
    fireEvent.press(screen.getByText('Send access request'));

    expect(await screen.findByText('Unable to create request')).toBeTruthy();
    expect(screen.getByLabelText('Emergency access reason detail')).toBeTruthy();
  });

  it('shows waiting state without exposing handover before activation', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([
      makeAssignment(coolingOffRequest)
    ]);

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Waiting for Review')).toBeTruthy();
    expect(screen.queryByText('Where to Look')).toBeNull();
    expect(mockedEmergencyApi.getContactEmergencyHandover).not.toHaveBeenCalled();
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

  it('shows terminal expired state without fetching handover', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([
      makeAssignment({ ...coolingOffRequest, status: 'EXPIRED' })
    ]);

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('Access expired')).toBeTruthy();
    expect(mockedEmergencyApi.getContactEmergencyHandover).not.toHaveBeenCalled();
  });

  it('shows unauthorized contact state', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([]);

    render(<ContactEmergencyModeScreen />);

    expect(await screen.findByText('No verified assignment')).toBeTruthy();
  });

  it('is exposed through the contact emergency route', async () => {
    mockedEmergencyApi.getContactAccessContext.mockResolvedValue([]);

    render(<ContactEmergencyRoute />);

    expect(await screen.findByText('Emergency mode')).toBeTruthy();
  });
});
