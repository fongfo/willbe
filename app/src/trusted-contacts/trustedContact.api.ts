import { apiClient } from '../api';
import type {
  AssignedTrustedContactPlan,
  BoundTrustedContact,
  CreateTrustedContactInput,
  TrustedContact,
  TrustedContactInvite,
  UpdateTrustedContactInput
} from './trustedContact.types';

const RESOURCE = '/trusted-contacts';

/** Fetches every trusted contact in the plan. */
export async function listTrustedContacts(
  signal?: AbortSignal
): Promise<TrustedContact[]> {
  const data = await apiClient.get<TrustedContact[]>(RESOURCE, signal);
  return data ?? [];
}

/** Fetches plans where the authenticated user is the verified trusted contact. */
export async function listAssignedTrustedContactPlans(
  signal?: AbortSignal
): Promise<AssignedTrustedContactPlan[]> {
  const data = await apiClient.get<AssignedTrustedContactPlan[]>(
    `${RESOURCE}/assigned-plans`,
    signal
  );
  return data ?? [];
}

/** Creates a new trusted contact and returns the persisted record. */
export async function createTrustedContact(
  input: CreateTrustedContactInput,
  signal?: AbortSignal
): Promise<TrustedContact> {
  const data = await apiClient.post<TrustedContact>(RESOURCE, input, signal);
  if (!data) {
    throw new Error('Trusted contact creation returned no data');
  }
  return data;
}

/** Updates an existing trusted contact and returns the persisted record. */
export async function updateTrustedContact(
  id: string,
  input: UpdateTrustedContactInput,
  signal?: AbortSignal
): Promise<TrustedContact> {
  const data = await apiClient.patch<TrustedContact>(`${RESOURCE}/${id}`, input, signal);
  if (!data) {
    throw new Error('Trusted contact update returned no data');
  }
  return data;
}

/** Creates or refreshes a single-use invite token for a trusted contact. */
export async function createTrustedContactInvite(
  id: string,
  signal?: AbortSignal
): Promise<TrustedContactInvite> {
  const data = await apiClient.post<TrustedContactInvite>(`${RESOURCE}/${id}/invite`, {}, signal);
  if (!data) {
    throw new Error('Trusted contact invite returned no data');
  }
  return data;
}

/** Binds an invited trusted contact record to the authenticated contact account. */
export async function bindTrustedContact(
  id: string,
  inviteToken: string,
  signal?: AbortSignal
): Promise<BoundTrustedContact> {
  const data = await apiClient.post<BoundTrustedContact>(
    `${RESOURCE}/${id}/bind`,
    { inviteToken },
    signal
  );
  if (!data) {
    throw new Error('Trusted contact binding returned no data');
  }
  return data;
}

/** Deletes an existing trusted contact. */
export async function deleteTrustedContact(
  id: string,
  signal?: AbortSignal
): Promise<void> {
  await apiClient.delete(`${RESOURCE}/${id}`, signal);
}
