import { apiClient } from '../src/api';
import { getPlanProgress } from '../src/plan/planProgress.api';
import {
  getReviewSetting,
  saveReviewSetting
} from '../src/check-in/reviewSettings.api';

jest.mock('../src/api', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn()
  }
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

afterEach(() => jest.clearAllMocks());

describe('plan progress and review setting APIs', () => {
  it('fetches aggregate plan progress', async () => {
    mockedApiClient.get.mockResolvedValue({
      completedSetupSteps: 1,
      hasFamilyMembers: true,
      hasTrustedContacts: false,
      hasAssetReferences: false,
      hasCheckInSetup: false
    });

    await expect(getPlanProgress()).resolves.toMatchObject({
      completedSetupSteps: 1,
      hasFamilyMembers: true
    });
    expect(mockedApiClient.get).toHaveBeenCalledWith('/plan-progress', undefined);
  });

  it('rejects an empty plan progress response', async () => {
    mockedApiClient.get.mockResolvedValue(undefined);

    await expect(getPlanProgress()).rejects.toThrow('Plan progress response was empty');
  });

  it('fetches review settings', async () => {
    mockedApiClient.get.mockResolvedValue({
      checkInFrequency: 'EVERY_6_MONTHS',
      connectedProviders: []
    });

    await expect(getReviewSetting()).resolves.toEqual({
      checkInFrequency: 'EVERY_6_MONTHS',
      connectedProviders: []
    });
    expect(mockedApiClient.get).toHaveBeenCalledWith('/review-settings', undefined);
  });

  it('saves review settings', async () => {
    const setting = {
      checkInFrequency: 'EVERY_3_MONTHS' as const,
      connectedProviders: ['GOOGLE_DRIVE' as const]
    };
    mockedApiClient.put.mockResolvedValue(setting);

    await expect(saveReviewSetting(setting)).resolves.toEqual(setting);
    expect(mockedApiClient.put).toHaveBeenCalledWith(
      '/review-settings',
      setting,
      undefined
    );
  });

  it('rejects empty review setting responses', async () => {
    mockedApiClient.get.mockResolvedValue(undefined);
    mockedApiClient.put.mockResolvedValue(undefined);

    await expect(getReviewSetting()).rejects.toThrow('Review setting response was empty');
    await expect(
      saveReviewSetting({
        checkInFrequency: 'EVERY_3_MONTHS',
        connectedProviders: []
      })
    ).rejects.toThrow('Review setting response was empty');
  });
});
