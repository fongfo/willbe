import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="consent" options={{ headerShown: true, title: 'Consent' }} />
      <Stack.Screen
        name="family-members"
        options={{ headerShown: true, title: 'Family' }}
      />
      <Stack.Screen
        name="trusted-contacts"
        options={{ headerShown: true, title: 'Trusted contacts' }}
      />
    </Stack>
  );
}
