import { StyleSheet, Text, View } from 'react-native';

/**
 * Minimal placeholder used by the WB-29 navigation skeleton.
 * Real visuals arrive with the design system in WB-30 and each screen's own task.
 */
interface PlaceholderScreenProps {
  title: string;
  subtitle?: string;
}

export default function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps) {
  return (
    <View style={styles.container} testID="placeholder-screen">
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
