import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/tokens';

interface ScreenProps {
  children: ReactNode;
  /** Disable the default horizontal/vertical padding for full-bleed layouts. */
  padded?: boolean;
  style?: ViewStyle;
}

export default function Screen({ children, padded = true, style }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.body, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg
  },
  body: {
    flex: 1
  },
  padded: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg
  }
});
