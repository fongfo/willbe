import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme/tokens';

type BadgeTone = 'success' | 'warn' | 'danger';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export default function Badge({ label, tone = 'success' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`${tone}Bg`]]}>
      <Text style={[styles.text, styles[`${tone}Text`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    alignSelf: 'flex-start'
  },
  text: {
    fontSize: 11,
    fontWeight: '700'
  },
  successBg: { backgroundColor: colors.successBg },
  successText: { color: colors.successText },
  warnBg: { backgroundColor: colors.warnBg },
  warnText: { color: colors.warnText },
  dangerBg: { backgroundColor: colors.dangerBg },
  dangerText: { color: colors.dangerText }
});
