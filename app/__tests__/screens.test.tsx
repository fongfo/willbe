import { render, screen } from '@testing-library/react-native';

import PlaceholderScreen from '../src/screens/PlaceholderScreen';
import HomeScreen from '../src/app/(tabs)/home';
import PlanScreen from '../src/app/(tabs)/plan';
import ReadinessScreen from '../src/app/(tabs)/readiness';
import AccountScreen from '../src/app/(tabs)/account';
import ConsentScreen from '../src/app/consent';

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
    [HomeScreen, 'Home'],
    [PlanScreen, 'Plan'],
    [ReadinessScreen, 'Readiness'],
    [AccountScreen, 'Account'],
    [ConsentScreen, 'Consent'],
  ])('renders the %s screen heading', (Screen, heading) => {
    render(<Screen />);

    expect(screen.getByText(heading)).toBeTruthy();
  });
});
