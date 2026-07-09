import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import AccountScreen from '../src/account/AccountScreen';

const authenticate = jest.fn().mockResolvedValue({
  user: {
    id: 'user-1',
    privyUserId: 'dev:aisyah.rahman@gmail.com',
    email: 'aisyah.rahman@gmail.com',
    name: 'Aisyah Rahman',
    walletAddress: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
  }
});

beforeEach(() => {
  authenticate.mockClear();
});

describe('AccountScreen', () => {
  it('starts with the email sign-in entry point', () => {
    render(<AccountScreen authenticate={authenticate} />);

    expect(screen.getByText('Create your Pusaka account')).toBeTruthy();
    expect(screen.getByText('Continue with email')).toBeTruthy();
    expect(screen.getByText(/quietly creates a secure proof wallet/i)).toBeTruthy();
  });

  it('creates an embedded-wallet session and shows the account control center', async () => {
    render(<AccountScreen authenticate={authenticate} />);

    fireEvent.press(screen.getByText('Continue with email'));

    await waitFor(() => {
      expect(screen.getByText('Zero-knowledge privacy')).toBeTruthy();
    });
    expect(screen.getByText('Proof of Plan')).toBeTruthy();
    expect(screen.getByText('Privacy & Data')).toBeTruthy();
    expect(screen.getByText('Security')).toBeTruthy();
    expect(authenticate).toHaveBeenCalledWith({
      email: 'aisyah.rahman@gmail.com',
      name: 'Aisyah Rahman'
    });
  });

  it('explains consent withdrawal impact before action', async () => {
    render(<AccountScreen authenticate={authenticate} />);

    fireEvent.press(screen.getByText('Continue with email'));
    await screen.findByText('Withdraw consent');
    fireEvent.press(screen.getByText('Withdraw consent'));

    expect(screen.getByText('Withdraw consent?')).toBeTruthy();
    expect(screen.getByText(/may pause Proof of Plan updates/i)).toBeTruthy();
  });

  it('returns to sign-in after sign out', async () => {
    render(<AccountScreen authenticate={authenticate} />);

    fireEvent.press(screen.getByText('Continue with email'));
    await screen.findByText('Sign out');
    fireEvent.press(screen.getByText('Sign out'));

    expect(screen.getByText('Create your Pusaka account')).toBeTruthy();
  });
});
