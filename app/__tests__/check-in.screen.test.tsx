import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import CheckInRoute from '../src/app/check-in';
import CheckInCloudScreen from '../src/check-in/CheckInCloudScreen';
import * as reviewSettingsApi from '../src/check-in/reviewSettings.api';

jest.mock('../src/check-in/reviewSettings.api');
jest.mock('../src/navigation/useRefreshOnFocus', () => ({
  useRefreshOnFocus: jest.fn()
}));

const mockedReviewSettingsApi = reviewSettingsApi as jest.Mocked<typeof reviewSettingsApi>;

beforeEach(() => {
  mockedReviewSettingsApi.getReviewSetting.mockResolvedValue({
    checkInFrequency: 'EVERY_6_MONTHS',
    connectedProviders: []
  });
  mockedReviewSettingsApi.saveReviewSetting.mockImplementation(async (input) => input);
});

afterEach(() => jest.clearAllMocks());

describe('CheckInCloudScreen', () => {
  it('renders the default quarterly check-in setup', () => {
    render(<CheckInCloudScreen />);

    expect(screen.getByText('Keep the plan fresh')).toBeTruthy();
    expect(screen.getByText(/Next review cadence: Quarterly/)).toBeTruthy();
    expect(screen.getByText(/No folder connected yet/)).toBeTruthy();
  });

  it('loads an existing saved check-in setup', async () => {
    mockedReviewSettingsApi.getReviewSetting.mockResolvedValueOnce({
      checkInFrequency: 'EVERY_12_MONTHS',
      connectedProviders: ['ONEDRIVE']
    });

    render(<CheckInCloudScreen />);

    await waitFor(() =>
      expect(screen.getByText(/Next review cadence: Yearly/)).toBeTruthy()
    );
    expect(screen.getByText(/Connected to OneDrive/)).toBeTruthy();
  });

  it('changes and saves the selected check-in frequency', async () => {
    render(<CheckInCloudScreen />);

    fireEvent.press(screen.getByLabelText('Monthly check-in frequency'));

    expect(screen.getByText(/Next review cadence: Monthly/)).toBeTruthy();
    await waitFor(() =>
      expect(mockedReviewSettingsApi.saveReviewSetting).toHaveBeenCalledWith({
        checkInFrequency: 'EVERY_3_MONTHS',
        connectedProviders: []
      })
    );
  });

  it('selects and connects a cloud provider', async () => {
    render(<CheckInCloudScreen />);

    fireEvent.press(screen.getByLabelText('iCloud Drive cloud provider'));
    fireEvent.press(screen.getByText('Connect iCloud Drive'));

    expect(screen.getByText(/Connected to iCloud Drive/)).toBeTruthy();
    expect(screen.getByText('Disconnect iCloud Drive')).toBeTruthy();
    await waitFor(() =>
      expect(mockedReviewSettingsApi.saveReviewSetting).toHaveBeenCalledWith({
        checkInFrequency: 'EVERY_3_MONTHS',
        connectedProviders: ['ICLOUD']
      })
    );
  });

  it('surfaces save errors without hiding the local choice', async () => {
    mockedReviewSettingsApi.saveReviewSetting.mockRejectedValueOnce(
      new Error('Unable to persist review setting')
    );

    render(<CheckInCloudScreen />);

    fireEvent.press(screen.getByLabelText('Yearly check-in frequency'));

    expect(screen.getByText(/Next review cadence: Yearly/)).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByText('Unable to persist review setting')).toBeTruthy()
    );
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
