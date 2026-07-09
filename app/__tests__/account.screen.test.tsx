import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AccountView } from '../src/account/AccountScreen';
import type { AccountController } from '../src/account/AccountScreen';

jest.mock('@privy-io/expo', () => ({
  useEmbeddedEthereumWallet: jest.fn(),
  useIdentityToken: jest.fn(),
  useLoginWithEmail: jest.fn(),
  usePrivy: jest.fn()
}));

const sendCode = jest.fn().mockResolvedValue(undefined);
const verifyCode = jest.fn().mockResolvedValue({
  user: {
    id: 'user-1',
    privyUserId: 'did:privy:user-1',
    email: 'aisyah.rahman@gmail.com',
    name: null,
    walletAddress: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
  }
});
const signOut = jest.fn();
const getCurrentSession = jest.fn().mockResolvedValue({
  user: {
    id: 'user-1',
    privyUserId: 'did:privy:user-1',
    email: 'aisyah.rahman@gmail.com',
    name: null,
    walletAddress: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
  }
});
const controller: AccountController = {
  isReady: true,
  sendCode,
  verifyCode,
  getCurrentSession,
  signOut
};

beforeEach(() => {
  sendCode.mockClear();
  verifyCode.mockClear();
  getCurrentSession.mockClear();
  signOut.mockClear();
});

describe('AccountScreen', () => {
  it('starts with the email sign-in entry point', () => {
    render(<AccountView controller={controller} />);

    expect(screen.getByText('Create your Pusaka account')).toBeTruthy();
    expect(screen.getByText('Continue with email')).toBeTruthy();
    expect(screen.getByText(/quietly creates a secure proof wallet/i)).toBeTruthy();
  });

  it('creates an embedded-wallet session and shows the account control center', async () => {
    render(<AccountView controller={controller} />);

    fireEvent.press(screen.getByText('Continue with email'));
    await screen.findByText('Verify and continue');
    fireEvent.changeText(screen.getByLabelText('Verification code'), '123456');
    fireEvent.press(screen.getByText('Verify and continue'));

    await waitFor(() => {
      expect(screen.getByText('Zero-knowledge privacy')).toBeTruthy();
    });
    expect(screen.getByText('Proof of Plan')).toBeTruthy();
    expect(screen.getByText('Privacy & Data')).toBeTruthy();
    expect(screen.getByText('Security')).toBeTruthy();
    expect(sendCode).toHaveBeenCalledWith('aisyah.rahman@gmail.com');
    expect(verifyCode).toHaveBeenCalledWith({
      email: 'aisyah.rahman@gmail.com',
      code: '123456'
    });
  });

  it('shows the Privy error detail when email code delivery fails', async () => {
    sendCode.mockRejectedValueOnce(
      new Error('Native app ID host.exp.Exponent has not been set as an allowed app identifier.')
    );

    render(<AccountView controller={controller} />);

    fireEvent.press(screen.getByText('Continue with email'));

    expect(
      await screen.findByText(
        'Native app ID host.exp.Exponent has not been set as an allowed app identifier.'
      )
    ).toBeTruthy();
  });

  it('restores an existing Privy session instead of asking for another OTP login', async () => {
    render(<AccountView controller={{ ...controller, existingSessionKey: 'did:privy:user-1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Zero-knowledge privacy')).toBeTruthy();
    });
    expect(getCurrentSession).toHaveBeenCalledTimes(1);
    expect(sendCode).not.toHaveBeenCalled();
    expect(verifyCode).not.toHaveBeenCalled();
  });

  it('explains consent withdrawal impact before action', async () => {
    render(<AccountView controller={controller} />);

    fireEvent.press(screen.getByText('Continue with email'));
    await screen.findByText('Verify and continue');
    fireEvent.changeText(screen.getByLabelText('Verification code'), '123456');
    fireEvent.press(screen.getByText('Verify and continue'));
    await screen.findByText('Withdraw consent');
    fireEvent.press(screen.getByText('Withdraw consent'));

    expect(screen.getByText('Withdraw consent?')).toBeTruthy();
    expect(screen.getByText(/may pause Proof of Plan updates/i)).toBeTruthy();
  });

  it('returns to sign-in after sign out', async () => {
    render(<AccountView controller={controller} />);

    fireEvent.press(screen.getByText('Continue with email'));
    await screen.findByText('Verify and continue');
    fireEvent.changeText(screen.getByLabelText('Verification code'), '123456');
    fireEvent.press(screen.getByText('Verify and continue'));
    await screen.findByText('Sign out');
    fireEvent.press(screen.getByText('Sign out'));

    await waitFor(() => {
      expect(screen.getByText('Create your Pusaka account')).toBeTruthy();
    });
    expect(signOut).toHaveBeenCalled();
  });
});
