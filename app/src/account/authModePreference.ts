import * as SecureStore from 'expo-secure-store';

export type AuthMode = 'planner' | 'contact';

const AUTH_MODE_KEY = 'pusaka.authMode';
const DEFAULT_AUTH_MODE: AuthMode = 'planner';

function isAuthMode(value: string | null): value is AuthMode {
  return value === 'planner' || value === 'contact';
}

export async function readAuthModePreference(): Promise<AuthMode> {
  try {
    const storedMode = await SecureStore.getItemAsync(AUTH_MODE_KEY);
    return isAuthMode(storedMode) ? storedMode : DEFAULT_AUTH_MODE;
  } catch {
    return DEFAULT_AUTH_MODE;
  }
}

export async function writeAuthModePreference(mode: AuthMode): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_MODE_KEY, mode);
  } catch {
    // Auth mode still updates in memory; persistence is a convenience for the next launch.
  }
}
