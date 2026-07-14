import { apiClient } from '../api';
import type { PlanSetupProgress } from './planProgress';

const RESOURCE = '/plan-progress';

export async function getPlanProgress(
  signal?: AbortSignal
): Promise<PlanSetupProgress> {
  const data = await apiClient.get<PlanSetupProgress>(RESOURCE, signal);
  if (!data) {
    throw new Error('Plan progress response was empty');
  }
  return data;
}
