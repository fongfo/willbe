import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii } from '../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.base, styles[variant], disabled && styles.disabled, style]}
    >
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primary: {
    backgroundColor: colors.teal
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#d8e3de'
  },
  danger: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#e7d6d0'
  },
  disabled: {
    opacity: 0.5
  },
  label: {
    fontSize: 16,
    fontWeight: '700'
  },
  primaryLabel: {
    color: colors.white
  },
  secondaryLabel: {
    color: colors.ink,
    fontWeight: '600'
  },
  dangerLabel: {
    color: colors.dangerText,
    fontWeight: '600'
  }
});
