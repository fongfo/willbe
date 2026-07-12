import { Stack } from 'expo-router';
import { AccountAuthProvider } from '../account/AccountAuthContext';
import AuthGate from '../account/AuthGate';
import PrivyAppProvider from '../privy/PrivyAppProvider';

export default function RootLayout() {
  return (
    <PrivyAppProvider>
      <AccountAuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="consent" options={{ headerShown: true, title: 'Consent' }} />
          <Stack.Screen name="family-members" options={{ headerShown: true, title: 'Family' }} />
          <Stack.Screen
            name="trusted-contacts"
            options={{ headerShown: true, title: 'Trusted contacts' }}
          />
          <Stack.Screen
            name="asset-references"
            options={{ headerShown: true, title: 'Asset references' }}
          />
          <Stack.Screen name="check-in" options={{ headerShown: true, title: 'Check-in' }} />
          <Stack.Screen
            name="emergency-handover"
            options={{ headerShown: true, title: 'Emergency handover' }}
          />
        </Stack>
        <AuthGate />
      </AccountAuthProvider>
    </PrivyAppProvider>
  );
}
