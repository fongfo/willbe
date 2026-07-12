import { useRouter, useSegments } from 'expo-router';
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
  const { status } = useAccountAuth();
  const router = useRouter();
  const segments = useSegments();
  const isAuthRoute = segments[0] === 'auth';

  useEffect(() => {
    if (status === 'checking') {
      return;
    }

    if (status === 'unauthenticated' && !isAuthRoute) {
      router.replace('/auth');
      return;
    }

    if (status === 'authenticated' && isAuthRoute) {
      router.replace('/home');
    }
  }, [isAuthRoute, router, status]);

  return status === 'checking' ? <AuthCheckingScreen /> : null;
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
