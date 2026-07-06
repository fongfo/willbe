import { fireEvent, render, screen } from '@testing-library/react-native';
import CheckInRoute from '../src/app/check-in';
import CheckInCloudScreen from '../src/check-in/CheckInCloudScreen';

describe('CheckInCloudScreen', () => {
  it('renders the default quarterly check-in setup', () => {
    render(<CheckInCloudScreen />);

    expect(screen.getByText('Keep the plan fresh')).toBeTruthy();
    expect(screen.getByText(/Next review cadence: Quarterly/)).toBeTruthy();
    expect(screen.getByText(/No folder connected yet/)).toBeTruthy();
  });

  it('changes the selected check-in frequency', () => {
    render(<CheckInCloudScreen />);

    fireEvent.press(screen.getByLabelText('Monthly check-in frequency'));

    expect(screen.getByText(/Next review cadence: Monthly/)).toBeTruthy();
  });

  it('selects and connects a cloud provider', () => {
    render(<CheckInCloudScreen />);

    fireEvent.press(screen.getByLabelText('iCloud Drive cloud provider'));
    fireEvent.press(screen.getByText('Connect iCloud Drive'));

    expect(screen.getByText(/Connected to iCloud Drive/)).toBeTruthy();
    expect(screen.getByText('Disconnect iCloud Drive')).toBeTruthy();
  });

  it('shows the cloud privacy boundary', () => {
    render(<CheckInCloudScreen />);

    expect(screen.getByText(/does not read\s+files, sync document contents/)).toBeTruthy();
    expect(screen.getByText(/store cloud passwords/)).toBeTruthy();
  });

  it('is exposed through the check-in route', () => {
    render(<CheckInRoute />);

    expect(screen.getByText('Keep the plan fresh')).toBeTruthy();
  });
});
