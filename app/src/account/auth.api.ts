import { apiClient } from '../api/client';
import type { AuthSession, SignInInput } from './auth.types';

function buildDevAccessToken(input: SignInInput): string {
  return `dev:${encodeURIComponent(input.email)}:${encodeURIComponent(input.name)}`;
}

export async function authenticateWithEmbeddedWallet(
  input: SignInInput,
  signal?: AbortSignal
): Promise<AuthSession> {
  const accessToken = buildDevAccessToken(input);
  const session = await apiClient.postWithHeaders<AuthSession>(
    '/api/auth/session',
    {},
    { Authorization: `Bearer ${accessToken}` },
    signal
  );

  if (!session) {
    throw new Error('Authentication did not return a session.');
  }
  return session;
}
