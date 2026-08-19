import { apiClient } from '../api';
import type {
  ContactAccessAssignment,
  ContactEmergencyHandover,
  CreateEmergencyAccessRequestInput,
  EmergencyAccessRequestSummary
} from './emergencyAccess.types';

const RESOURCE = '/emergency-access';

export async function getContactAccessContext(
  signal?: AbortSignal
): Promise<ContactAccessAssignment[]> {
  const data = await apiClient.get<ContactAccessAssignment[]>(
    `${RESOURCE}/contact/context`,
    signal
  );
  return data ?? [];
}

export async function createEmergencyAccessRequest(
  input: CreateEmergencyAccessRequestInput,
  signal?: AbortSignal
): Promise<EmergencyAccessRequestSummary> {
  const data = await apiClient.post<EmergencyAccessRequestSummary>(
    `${RESOURCE}/contact/requests`,
    input,
    signal
  );
  if (!data) {
    throw new Error('Emergency access request returned no data');
  }
  return data;
}

export async function getContactEmergencyHandover(
  requestId: string,
  signal?: AbortSignal
): Promise<ContactEmergencyHandover> {
  const data = await apiClient.get<ContactEmergencyHandover>(
    `${RESOURCE}/contact/requests/${requestId}/handover`,
    signal
  );
  if (!data) {
    throw new Error('Emergency handover returned no data');
  }
  return data;
}

export async function closeEmergencyAccessRequest(
  requestId: string,
  signal?: AbortSignal
): Promise<EmergencyAccessRequestSummary> {
  const data = await apiClient.post<EmergencyAccessRequestSummary>(
    `${RESOURCE}/contact/requests/${requestId}/close`,
    {},
    signal
  );
  if (!data) {
    throw new Error('Emergency access close returned no data');
  }
  return data;
}

export async function confirmBackupEmergencyAccessRequest(
  requestId: string,
  signal?: AbortSignal
): Promise<EmergencyAccessRequestSummary> {
  const data = await apiClient.post<EmergencyAccessRequestSummary>(
    `${RESOURCE}/contact/requests/${requestId}/backup-confirm`,
    {},
    signal
  );
  if (!data) {
    throw new Error('Backup confirmation returned no data');
  }
  return data;
}

export async function denyBackupEmergencyAccessRequest(
  requestId: string,
  signal?: AbortSignal
): Promise<EmergencyAccessRequestSummary> {
  const data = await apiClient.post<EmergencyAccessRequestSummary>(
    `${RESOURCE}/contact/requests/${requestId}/backup-deny`,
    {},
    signal
  );
  if (!data) {
    throw new Error('Backup denial returned no data');
  }
  return data;
}
