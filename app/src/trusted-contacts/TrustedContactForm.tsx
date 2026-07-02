import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../components/Button';
import { RELATION_OPTIONS } from '../family-members/relations';
import type { Relation } from '../family-members/familyMember.types';
import { colors, radii, spacing } from '../theme/tokens';
import { trustedContactFormSchema } from './trustedContact.schema';
import type { ContactRole, CreateTrustedContactInput } from './trustedContact.types';
import { ROLE_OPTIONS } from './roles';

interface TrustedContactFormProps {
  onSubmit: (input: CreateTrustedContactInput) => Promise<void>;
}

export default function TrustedContactForm({ onSubmit }: TrustedContactFormProps) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<Relation>('SPOUSE');
  const [role, setRole] = useState<ContactRole>('PRIMARY');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(): Promise<void> {
    const parsed = trustedContactFormSchema.safeParse({
      name,
      relation,
      role,
      phone,
      email,
      detail
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: parsed.data.name,
        relation: parsed.data.relation,
        role: parsed.data.role,
        phone: parsed.data.phone,
        email: parsed.data.email ?? null,
        detail: parsed.data.detail ?? null
      });
      setName('');
      setPhone('');
      setEmail('');
      setDetail('');
      setRelation('SPOUSE');
      setRole('PRIMARY');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save contact');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Sara Abdullah"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
        accessibilityLabel="Name"
      />

      <Text style={styles.label}>Relation</Text>
      <View style={styles.chipRow}>
        {RELATION_OPTIONS.map((option) => {
          const selected = option.value === relation;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setRelation(option.value)}
              style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
            >
              <Text style={selected ? styles.chipTextOn : styles.chipTextOff}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Role</Text>
      <View style={styles.chipRow}>
        {ROLE_OPTIONS.map((option) => {
          const selected = option.value === role;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setRole(option.value)}
              style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
            >
              <Text style={selected ? styles.chipTextOn : styles.chipTextOff}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. +60123456789"
        placeholderTextColor={colors.muted}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        accessibilityLabel="Phone"
      />

      <Text style={styles.label}>Email (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. sara@example.com"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="Email"
      />

      <Text style={styles.label}>Detail (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Lives in Penang"
        placeholderTextColor={colors.muted}
        value={detail}
        onChangeText={setDetail}
        accessibilityLabel="Detail"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={submitting ? 'Saving…' : 'Add trusted contact'}
        onPress={handleSubmit}
        disabled={submitting}
        style={styles.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted2,
    marginTop: spacing.sm
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#d8e3de',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 14.5,
    color: colors.ink
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1.5
  },
  chipOn: {
    backgroundColor: '#dcefe9',
    borderColor: colors.teal
  },
  chipOff: {
    backgroundColor: colors.white,
    borderColor: '#e2e8e5'
  },
  chipTextOn: {
    color: colors.tealDark,
    fontWeight: '600',
    fontSize: 13.5
  },
  chipTextOff: {
    color: '#3f5a54',
    fontWeight: '600',
    fontSize: 13.5
  },
  error: {
    color: colors.dangerText,
    fontSize: 13
  },
  submit: {
    marginTop: spacing.md
  }
});
