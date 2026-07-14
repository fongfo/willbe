import { apiClient } from '../api';

export type ReviewSettingFrequency =
  | 'EVERY_3_MONTHS'
  | 'EVERY_6_MONTHS'
  | 'EVERY_12_MONTHS'
  | 'CUSTOM_ANNUAL';

export type ReviewSettingCloudProvider =
  | 'GOOGLE_DRIVE'
  | 'ONEDRIVE'
  | 'DROPBOX'
  | 'ICLOUD';

export interface ReviewSetting {
  checkInFrequency: ReviewSettingFrequency;
  connectedProviders: ReviewSettingCloudProvider[];
}

const RESOURCE = '/review-settings';

export async function getReviewSetting(signal?: AbortSignal): Promise<ReviewSetting> {
  const data = await apiClient.get<ReviewSetting>(RESOURCE, signal);
  if (!data) {
    throw new Error('Review setting response was empty');
  }
  return data;
}

export async function saveReviewSetting(
  input: ReviewSetting,
  signal?: AbortSignal
): Promise<ReviewSetting> {
  const data = await apiClient.put<ReviewSetting>(RESOURCE, input, signal);
  if (!data) {
    throw new Error('Review setting response was empty');
  }
  return data;
}
