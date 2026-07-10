import { apiClient } from '../api/client';
import type { AuthSession } from './auth.types';

export async function createPrivyAccountSession(
  accessToken: string,
  identityToken?: string | null,
  signal?: AbortSignal
): Promise<AuthSession> {
  const session = await apiClient.postWithHeaders<AuthSession>(
    '/auth/session',
    identityToken ? { identityToken } : {},
    { Authorization: `Bearer ${accessToken}` },
    signal
  );

  if (!session) {
    throw new Error('Authentication did not return a session.');
  }
  return session;
}
