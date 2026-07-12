import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AccountCenterView } from '../src/account/AccountScreen';
import AuthScreen from '../src/account/AuthScreen';
import { useAccountAuth } from '../src/account/AccountAuthContext';

jest.mock('../src/account/AccountAuthContext', () => ({
  useAccountAuth: jest.fn()
}));

const mockedUseAccountAuth = useAccountAuth as jest.MockedFunction<typeof useAccountAuth>;
const sendEmailCode = jest.fn().mockResolvedValue(undefined);
const verifyEmailCode = jest.fn().mockResolvedValue(undefined);
const retryWalletSync = jest.fn().mockResolvedValue(undefined);
const signOut = jest.fn().mockResolvedValue(undefined);
const accountUser = {
  id: 'user-1',
  privyUserId: 'did:privy:user-1',
  email: 'aisyah.rahman@gmail.com',
  name: null,
  walletAddress: '0x9a1f8e3b72c441056a9f2d4c7f86a61252d0b91e'
};

beforeEach(() => {
  sendEmailCode.mockClear();
  verifyEmailCode.mockClear();
  retryWalletSync.mockClear();
  signOut.mockClear();
  mockedUseAccountAuth.mockReturnValue({
    status: 'unauthenticated',
    user: null,
    error: null,
    walletStatus: 'pending',
    walletError: null,
    sendEmailCode,
    verifyEmailCode,
    retryWalletSync,
    signOut
  });
});

describe('AuthScreen', () => {
  it('starts with a disabled email entry point', () => {
    render(<AuthScreen />);

    const button = screen.getByRole('button', { name: 'Continue with email' });
    expect(screen.getByText('Protect your family plan')).toBeTruthy();
    expect(screen.getByText('Enter your email to continue.')).toBeTruthy();
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('validates email format before requesting a code', () => {
    render(<AuthScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'not-an-email');
    fireEvent(screen.getByLabelText('Email'), 'blur');

    expect(screen.getByText(/Use a valid email address/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue with email' }).props.accessibilityState.disabled).toBe(true);
  });

  it('sends a code after a valid email and shows the verification step', async () => {
    render(<AuthScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'aisyah.rahman@gmail.com');
    fireEvent.press(screen.getByText('Continue with email'));

    expect(await screen.findByText('Verify and continue')).toBeTruthy();
    expect(screen.getByText('Code sent to aisyah.rahman@gmail.com')).toBeTruthy();
    expect(sendEmailCode).toHaveBeenCalledWith('aisyah.rahman@gmail.com');
  });

  it('verifies the code for new registration or existing login', async () => {
    render(<AuthScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'aisyah.rahman@gmail.com');
    fireEvent.press(screen.getByText('Continue with email'));
    await screen.findByText('Verify and continue');
    fireEvent.changeText(screen.getByLabelText('Verification code'), '123456');
    fireEvent.press(screen.getByText('Verify and continue'));

    await waitFor(() => {
      expect(verifyEmailCode).toHaveBeenCalledWith({
        email: 'aisyah.rahman@gmail.com',
        code: '123456'
      });
    });
  });

  it('keeps the user on the code step when verification fails', async () => {
    verifyEmailCode.mockRejectedValueOnce(new Error('That code did not work.'));

    render(<AuthScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'aisyah.rahman@gmail.com');
    fireEvent.press(screen.getByText('Continue with email'));
    await screen.findByText('Verify and continue');
    fireEvent.changeText(screen.getByLabelText('Verification code'), '000000');
    fireEvent.press(screen.getByText('Verify and continue'));

    expect(await screen.findByText('That code did not work.')).toBeTruthy();
    expect(screen.getByText('Change')).toBeTruthy();
  });
});

describe('AccountCenterView', () => {
  it('shows the account control center for an authenticated user', () => {
    render(
      <AccountCenterView
        onRetryWallet={retryWalletSync}
        onSignOut={signOut}
        user={accountUser}
        walletStatus="ready"
      />
    );

    expect(screen.getByText('Zero-knowledge privacy')).toBeTruthy();
    expect(screen.getByText('Proof of Plan')).toBeTruthy();
    expect(screen.getByText('Privacy & Data')).toBeTruthy();
    expect(screen.getByText('Security')).toBeTruthy();
  });

  it('lets the user retry proof wallet setup without blocking account access', () => {
    render(
      <AccountCenterView
        onRetryWallet={retryWalletSync}
        onSignOut={signOut}
        user={{ ...accountUser, walletAddress: null }}
        walletError="Proof wallet setup timed out."
        walletStatus="error"
      />
    );

    fireEvent.press(screen.getByText('Retry wallet setup'));

    expect(screen.getByText('Proof wallet setup timed out.')).toBeTruthy();
    expect(retryWalletSync).toHaveBeenCalled();
  });

  it('explains consent withdrawal impact before action', () => {
    render(
      <AccountCenterView
        onRetryWallet={retryWalletSync}
        onSignOut={signOut}
        user={accountUser}
        walletStatus="ready"
      />
    );

    fireEvent.press(screen.getByText('Withdraw consent'));

    expect(screen.getByText('Withdraw consent?')).toBeTruthy();
    expect(screen.getByText(/may pause Proof of Plan updates/i)).toBeTruthy();
  });

  it('signs out from the account center', () => {
    render(
      <AccountCenterView
        onRetryWallet={retryWalletSync}
        onSignOut={signOut}
        user={accountUser}
        walletStatus="ready"
      />
    );

    fireEvent.press(screen.getByText('Sign out'));

    expect(signOut).toHaveBeenCalled();
  });
});
