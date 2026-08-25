import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import TrustedContactsRoute from '../src/app/trusted-contacts';
import TrustedContactForm from '../src/trusted-contacts/TrustedContactForm';
import TrustedContactsScreen from '../src/trusted-contacts/TrustedContactsScreen';
import * as api from '../src/trusted-contacts/trustedContact.api';
import type { TrustedContact } from '../src/trusted-contacts/trustedContact.types';

jest.mock('../src/trusted-contacts/trustedContact.api');

const mockedApi = api as jest.Mocked<typeof api>;

function makeContact(overrides: Partial<TrustedContact> = {}): TrustedContact {
  return {
    id: 'c1',
    name: 'Imran Rahman',
    relation: 'SPOUSE',
    role: 'PRIMARY',
    phone: '+60123456789',
    email: null,
    verificationStatus: 'VERIFIED',
    detail: null,
    createdAt: '2026-07-02T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
    ...overrides
  };
}

afterEach(() => jest.clearAllMocks());

beforeEach(() => {
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
});

describe('TrustedContactsScreen', () => {
  it('renders contacts with a verification badge and subtitle', async () => {
    mockedApi.listTrustedContacts.mockResolvedValue([makeContact()]);

    render(<TrustedContactsScreen />);

    expect(await screen.findByText('Imran Rahman')).toBeTruthy();
    expect(screen.getByText('Spouse · Primary')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();
  });

  it('warns when fewer than two contacts exist', async () => {
    mockedApi.listTrustedContacts.mockResolvedValue([makeContact()]);

    render(<TrustedContactsScreen />);

    expect(await screen.findByText(/one more/)).toBeTruthy();
  });

  it('confirms readiness with two contacts including a primary', async () => {
    mockedApi.listTrustedContacts.mockResolvedValue([
      makeContact({ id: 'a', role: 'PRIMARY' }),
      makeContact({ id: 'b', name: 'Sara Abdullah', role: 'BACKUP' })
    ]);

    render(<TrustedContactsScreen />);

    expect(await screen.findByText(/enough trusted contacts/)).toBeTruthy();
  });

  it('shows the empty state', async () => {
    mockedApi.listTrustedContacts.mockResolvedValue([]);

    render(<TrustedContactsScreen />);

    expect(await screen.findByText(/No contacts yet/)).toBeTruthy();
  });

  it('surfaces a load error', async () => {
    mockedApi.listTrustedContacts.mockRejectedValue(new Error('Network down'));

    render(<TrustedContactsScreen />);

    expect(await screen.findByText('Network down')).toBeTruthy();
  });

  it('adds a new contact through the form', async () => {
    mockedApi.listTrustedContacts.mockResolvedValue([]);
    mockedApi.createTrustedContact.mockResolvedValue(
      makeContact({ id: 'c2', name: 'Sara Abdullah', role: 'BACKUP', verificationStatus: 'PENDING' })
    );

    render(<TrustedContactsScreen />);
    await screen.findByText(/No contacts yet/);

    fireEvent.changeText(screen.getByLabelText('Name'), 'Sara Abdullah');
    fireEvent.changeText(screen.getByLabelText('Phone'), '+60127654321');
    fireEvent.press(screen.getByText('Add trusted contact'));

    expect(await screen.findByText('Sara Abdullah')).toBeTruthy();
    expect(mockedApi.createTrustedContact).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Sara Abdullah', phone: '+60127654321', role: 'PRIMARY' })
    );
  });

  it('edits an existing contact through the form', async () => {
    mockedApi.listTrustedContacts.mockResolvedValue([makeContact()]);
    mockedApi.updateTrustedContact.mockResolvedValue(
      makeContact({ name: 'Imran Bin Rahman', phone: '+60127654321', role: 'BACKUP' })
    );

    render(<TrustedContactsScreen />);
    expect(await screen.findByText('Imran Rahman')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Edit Imran Rahman'));
    fireEvent.changeText(screen.getByLabelText('Name'), 'Imran Bin Rahman');
    fireEvent.changeText(screen.getByLabelText('Phone'), '+60127654321');
    fireEvent.press(screen.getByText('Backup'));
    fireEvent.press(screen.getByText('Save changes'));

    expect(await screen.findByText('Imran Bin Rahman')).toBeTruthy();
    expect(screen.getByText('Spouse · Backup')).toBeTruthy();
    expect(mockedApi.updateTrustedContact).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        name: 'Imran Bin Rahman',
        phone: '+60127654321',
        role: 'BACKUP'
      })
    );
  });

  it('deletes an existing contact from the list', async () => {
    mockedApi.listTrustedContacts.mockResolvedValue([makeContact()]);
    mockedApi.deleteTrustedContact.mockResolvedValue(undefined);

    render(<TrustedContactsScreen />);
    expect(await screen.findByText('Imran Rahman')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Delete Imran Rahman'));

    expect(await screen.findByText(/No contacts yet/)).toBeTruthy();
    expect(screen.queryByText('Imran Rahman')).toBeNull();
    expect(mockedApi.deleteTrustedContact).toHaveBeenCalledWith('c1');
  });

  it('sends an invite and shows the one-time token for sharing', async () => {
    const invitedContact = makeContact({
      email: 'imran@example.com',
      verificationStatus: 'PENDING',
      inviteSentAt: '2026-08-25T00:00:00.000Z',
      inviteTokenExpiresAt: '2099-09-08T00:00:00.000Z'
    });
    mockedApi.listTrustedContacts.mockResolvedValue([
      makeContact({ email: 'imran@example.com', verificationStatus: 'PENDING' })
    ]);
    mockedApi.createTrustedContactInvite.mockResolvedValue({
      contact: invitedContact,
      inviteToken: 'one-time-token-12345678901234567890',
      expiresAt: '2099-09-08T00:00:00.000Z'
    });

    render(<TrustedContactsScreen />);
    expect(await screen.findByText('Pending')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Send invite to Imran Rahman'));

    expect(await screen.findByText('one-time-token-12345678901234567890')).toBeTruthy();
    expect(screen.getByText('Invite sent')).toBeTruthy();
    expect(mockedApi.createTrustedContactInvite).toHaveBeenCalledWith('c1');

    fireEvent.press(screen.getByLabelText('Share invite for Imran Rahman'));
    await waitFor(() =>
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('one-time-token-12345678901234567890')
        })
      )
    );
  });

  it('revokes an active invite and clears the invite status', async () => {
    mockedApi.listTrustedContacts.mockResolvedValue([
      makeContact({
        email: 'imran@example.com',
        verificationStatus: 'PENDING',
        inviteSentAt: '2026-08-25T00:00:00.000Z',
        inviteTokenExpiresAt: '2099-09-08T00:00:00.000Z'
      })
    ]);
    mockedApi.revokeTrustedContactInvite.mockResolvedValue(
      makeContact({ email: 'imran@example.com', verificationStatus: 'PENDING' })
    );

    render(<TrustedContactsScreen />);
    expect(await screen.findByText('Invite sent')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Revoke invite for Imran Rahman'));

    expect(await screen.findByText('Pending')).toBeTruthy();
    expect(screen.getByText('Sent: Not sent')).toBeTruthy();
    expect(mockedApi.revokeTrustedContactInvite).toHaveBeenCalledWith('c1');
  });

  it('is exposed through the trusted-contacts route', async () => {
    mockedApi.listTrustedContacts.mockResolvedValue([]);

    render(<TrustedContactsRoute />);

    expect(await screen.findByText('Who should your family turn to?')).toBeTruthy();
  });
});

describe('TrustedContactForm', () => {
  it('blocks submission with an invalid phone number', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<TrustedContactForm onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Name'), 'Sara Abdullah');
    fireEvent.changeText(screen.getByLabelText('Phone'), 'abc');
    fireEvent.press(screen.getByText('Add trusted contact'));

    expect(screen.getByText('Enter a valid phone number')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('surfaces a submit failure from onSubmit', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Save failed'));
    render(<TrustedContactForm onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Name'), 'Sara Abdullah');
    fireEvent.changeText(screen.getByLabelText('Phone'), '+60127654321');
    fireEvent.press(screen.getByText('Add trusted contact'));

    expect(await screen.findByText('Save failed')).toBeTruthy();
  });

  it('prefills existing contact values in edit mode', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onCancel = jest.fn();

    render(
      <TrustedContactForm
        initialValue={makeContact({ email: 'imran@example.com', detail: 'Penang' })}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByDisplayValue('Imran Rahman')).toBeTruthy();
    expect(screen.getByDisplayValue('+60123456789')).toBeTruthy();
    expect(screen.getByDisplayValue('imran@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('Penang')).toBeTruthy();

    fireEvent.press(screen.getByText('Cancel edit'));
    expect(onCancel).toHaveBeenCalled();
  });
});
