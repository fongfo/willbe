import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

describe('app navigation skeleton', () => {
  it('redirects the root route to the Home tab', async () => {
    const router = renderRouter('src/app', { initialUrl: '/' });

    await act(async () => {});

    expect(router.getPathname()).toBe('/home');
    // Home tab label and screen title both read "Home"; assert on the unique subtitle.
    expect(screen.getByText('Dashboard arrives in WB-38.')).toBeTruthy();
  });

  it('navigates between the bottom tabs', async () => {
    const router = renderRouter('src/app', { initialUrl: '/home' });

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
