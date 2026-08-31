import { useRouter, useSegments } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, spacing } from '../theme/tokens';
import { useAccountAuth } from './AccountAuthContext';

function AuthCheckingScreen() {
  return (
    <View style={styles.checkingScreen}>
      <ActivityIndicator color={colors.teal} />
      <Text style={styles.checkingText}>Checking your account...</Text>
    </View>
  );
}

export default function AuthGate() {
  const { authMode, authModeReady, status } = useAccountAuth();
  const router = useRouter();
  const segments = useSegments();
  const isAuthRoute = segments[0] === 'auth';
  const isContactEmergencyRoute = String(segments[0]) === 'contact-emergency';

  useEffect(() => {
    if (status === 'checking' || !authModeReady) {
      return;
    }

    if (status === 'unauthenticated' && !isAuthRoute) {
      router.replace('/auth');
      return;
    }

    if (status === 'authenticated' && isAuthRoute) {
      router.replace((authMode === 'contact' ? '/contact-emergency' : '/home') as Href);
      return;
    }

    if (
      status === 'authenticated' &&
      authMode === 'contact' &&
      !isContactEmergencyRoute
    ) {
      router.replace('/contact-emergency' as Href);
    }
  }, [authMode, authModeReady, isAuthRoute, isContactEmergencyRoute, router, status]);

  return status === 'checking' || !authModeReady ? <AuthCheckingScreen /> : null;
}

const styles = StyleSheet.create({
  checkingScreen: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg
  },
  checkingText: {
    fontSize: fontSizes.small,
    color: colors.muted2
  }
});
