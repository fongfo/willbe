import { apiClient } from '../api';
import type {
  CreateFamilyMemberInput,
  FamilyMember,
  UpdateFamilyMemberInput
} from './familyMember.types';

const RESOURCE = '/family-members';

/** Fetches every family member in the plan. */
export async function listFamilyMembers(signal?: AbortSignal): Promise<FamilyMember[]> {
  const data = await apiClient.get<FamilyMember[]>(RESOURCE, signal);
  return data ?? [];
}

/** Creates a new family member and returns the persisted record. */
export async function createFamilyMember(
  input: CreateFamilyMemberInput,
  signal?: AbortSignal
): Promise<FamilyMember> {
  const data = await apiClient.post<FamilyMember>(RESOURCE, input, signal);
  if (!data) {
    throw new Error('Family member creation returned no data');
  }
  return data;
}

/** Updates an existing family member and returns the persisted record. */
export async function updateFamilyMember(
  id: string,
  input: UpdateFamilyMemberInput,
  signal?: AbortSignal
): Promise<FamilyMember> {
  const data = await apiClient.patch<FamilyMember>(`${RESOURCE}/${id}`, input, signal);
  if (!data) {
    throw new Error('Family member update returned no data');
  }
  return data;
}

/** Deletes an existing family member. */
export async function deleteFamilyMember(
  id: string,
  signal?: AbortSignal
): Promise<void> {
  await apiClient.delete(`${RESOURCE}/${id}`, signal);
}
