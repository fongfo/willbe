import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../components/Button';
import { colors, radii, spacing } from '../theme/tokens';
import { familyMemberFormSchema } from './familyMember.schema';
import type { CreateFamilyMemberInput, Relation } from './familyMember.types';
import { RELATION_OPTIONS } from './relations';

interface FamilyMemberFormProps {
  onSubmit: (input: CreateFamilyMemberInput) => Promise<void>;
}

export default function FamilyMemberForm({ onSubmit }: FamilyMemberFormProps) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<Relation>('SPOUSE');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(): Promise<void> {
    const parsed = familyMemberFormSchema.safeParse({ name, relation, detail });
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
        detail: parsed.data.detail ?? null
      });
      setName('');
      setDetail('');
      setRelation('SPOUSE');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save member');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Imran Rahman"
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

      <Text style={styles.label}>Detail (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Petaling Jaya · Age 14"
        placeholderTextColor={colors.muted}
        value={detail}
        onChangeText={setDetail}
        accessibilityLabel="Detail"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={submitting ? 'Saving…' : 'Add family member'}
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
