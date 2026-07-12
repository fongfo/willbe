export interface PrivyConfig {
  appId: string;
  clientId: string;
}

const appId = process.env.EXPO_PUBLIC_PRIVY_APP_ID;
const clientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;

export const privyConfig: PrivyConfig | null =
  appId && clientId
    ? {
        appId,
        clientId
      }
    : null;

export function hasPrivyConfig(): boolean {
  return Boolean(privyConfig);
}

export function shouldUsePrivyRuntime(): boolean {
  return hasPrivyConfig() && process.env.NODE_ENV !== 'test';
}
