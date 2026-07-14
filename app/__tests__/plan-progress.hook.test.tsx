import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { usePlanProgress } from '../src/plan/usePlanProgress';
import * as planProgressApi from '../src/plan/planProgress.api';

jest.mock('../src/plan/planProgress.api');

const mockedPlanProgressApi = planProgressApi as jest.Mocked<typeof planProgressApi>;

function PlanProgressHarness() {
  const { progress, loading, error } = usePlanProgress();
  return (
    <Text>
      {loading ? 'loading' : error ?? `${progress.completedSetupSteps} completed`}
    </Text>
  );
}

afterEach(() => jest.clearAllMocks());

describe('usePlanProgress', () => {
  it('loads aggregate progress', async () => {
    mockedPlanProgressApi.getPlanProgress.mockResolvedValue({
      completedSetupSteps: 2,
      hasFamilyMembers: true,
      hasTrustedContacts: true,
      hasAssetReferences: false,
      hasCheckInSetup: false
    });

    render(<PlanProgressHarness />);

    expect(screen.getByText('loading')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('2 completed')).toBeTruthy());
  });

  it('keeps empty progress and exposes the load error', async () => {
    mockedPlanProgressApi.getPlanProgress.mockRejectedValue(new Error('Progress unavailable'));

    render(<PlanProgressHarness />);

    await waitFor(() =>
      expect(screen.getByText('Progress unavailable')).toBeTruthy()
    );
  });
});
