import { fireEvent, render, screen } from '@testing-library/react-native';
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
});
