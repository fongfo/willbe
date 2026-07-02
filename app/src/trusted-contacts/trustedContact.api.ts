import { apiClient } from '../api';
import type {
  CreateTrustedContactInput,
  TrustedContact
} from './trustedContact.types';

const RESOURCE = '/trusted-contacts';

/** Fetches every trusted contact in the plan. */
export async function listTrustedContacts(
  signal?: AbortSignal
): Promise<TrustedContact[]> {
  const data = await apiClient.get<TrustedContact[]>(RESOURCE, signal);
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
