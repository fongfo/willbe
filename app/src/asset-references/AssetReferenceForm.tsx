import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../components/Button';
import { colors, radii, spacing } from '../theme/tokens';
import { assetReferenceFormSchema } from './assetReference.schema';
import type {
  AssetCategory,
  CreateAssetReferenceInput
} from './assetReference.types';
import { CATEGORY_OPTIONS, getCategoryLabel } from './categories';

interface AssetReferenceFormProps {
  onSubmit: (input: CreateAssetReferenceInput) => Promise<void>;
}

type Step = 'category' | 'details';

export default function AssetReferenceForm({ onSubmit }: AssetReferenceFormProps) {
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<AssetCategory | null>(null);
  const [name, setName] = useState('');
  const [locationHint, setLocationHint] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetToStart(): void {
    setStep('category');
    setCategory(null);
    setName('');
    setLocationHint('');
    setDetail('');
    setError(null);
  }

  async function handleSubmit(): Promise<void> {
    const parsed = assetReferenceFormSchema.safeParse({
      name,
      category,
      locationHint,
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
        category: parsed.data.category,
        locationHint: parsed.data.locationHint ?? null,
        detail: parsed.data.detail ?? null
      });
      resetToStart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save reference');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'category') {
    return (
      <View style={styles.form}>
        <Text style={styles.stepLabel}>Step 1 of 2 · Category</Text>
        <Text style={styles.prompt}>Pick a category to add</Text>
        <Text style={styles.help}>Just the type — no details yet.</Text>

        <View style={styles.chipRow}>
          {CATEGORY_OPTIONS.map((option) => {
            const selected = option.value === category;
            return (
              <Pressable
                key={option.value}
                accessibilityLabel={`${option.label} category`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCategory(option.value)}
                style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
              >
                <Text style={selected ? styles.chipTextOn : styles.chipTextOff}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label="Next"
          onPress={() => setStep('details')}
          disabled={category === null}
          style={styles.action}
        />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <View style={styles.detailHead}>
        <Pressable
          accessibilityLabel="Back to category"
          accessibilityRole="button"
          onPress={() => setStep('category')}
          style={styles.backButton}
        >
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.stepLabel}>Step 2 of 2 · {category ? getCategoryLabel(category) : ''}</Text>
      </View>
      <Text style={styles.prompt}>Where should your family look?</Text>
      <Text style={styles.help}>
        Names and locations only — never account numbers, balances, or passwords.
      </Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Maybank — main account"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
        accessibilityLabel="Name"
      />

      <Text style={styles.label}>Where to look (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Drive ▸ Family ▸ Banking"
        placeholderTextColor={colors.muted}
        value={locationHint}
        onChangeText={setLocationHint}
        accessibilityLabel="Where to look"
      />

      <Text style={styles.label}>Detail (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Joint with spouse"
        placeholderTextColor={colors.muted}
        value={detail}
        onChangeText={setDetail}
        accessibilityLabel="Detail"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={submitting ? 'Saving…' : 'Add reference'}
        onPress={handleSubmit}
        disabled={submitting}
        style={styles.action}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.muted
  },
  prompt: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    marginTop: spacing.xs
  },
  help: {
    fontSize: 12.5,
    color: colors.muted,
    lineHeight: 18
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  back: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted2
  },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: spacing.md
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
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
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
  action: {
    marginTop: spacing.md
  }
});
