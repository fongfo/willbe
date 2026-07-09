import type { PropsWithChildren } from 'react';
import { privyConfig, shouldUsePrivyRuntime } from './privyConfig';

export default function PrivyAppProvider({ children }: PropsWithChildren) {
  if (!privyConfig || !shouldUsePrivyRuntime()) {
    return <>{children}</>;
  }

  // Keep this lazy so Jest can render the router without native WebView modules.
  // Account runtime imports the SDK the same way so Privy context is shared.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrivyProvider } = require('@privy-io/expo') as typeof import('@privy-io/expo');

  return (
    <PrivyProvider appId={privyConfig.appId} clientId={privyConfig.clientId}>
      {children}
    </PrivyProvider>
  );
}
