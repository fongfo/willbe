import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import AssetReferenceForm from './AssetReferenceForm';
import AssetReferenceRow from './AssetReferenceRow';
import { useAssetReferences } from './useAssetReferences';

export default function AssetReferencesScreen() {
  const { references, loading, error, add } = useAssetReferences();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>What would your family need to find?</Text>
        <Text style={styles.lede}>
          Point to where things live — like telling a friend “I bank with Maybank.”
        </Text>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Asset references</Text>
          <Text style={styles.count}>{references.length}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.teal} accessibilityLabel="Loading" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : references.length === 0 ? (
          <Text style={styles.empty}>Nothing referenced yet. Add your first below.</Text>
        ) : (
          <View style={styles.list}>
            {references.map((reference) => (
              <AssetReferenceRow key={reference.id} reference={reference} />
            ))}
          </View>
        )}

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Pusaka stores the relationship and where to look — never account numbers,
            balances, or passwords.
          </Text>
        </View>

        <AssetReferenceForm onSubmit={async (input) => void (await add(input))} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl
  },
  heading: {
    fontSize: fontSizes.heading,
    color: colors.ink,
    fontWeight: '500'
  },
  lede: {
    fontSize: fontSizes.small,
    color: colors.muted,
    lineHeight: 20
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted
  },
  count: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: '600'
  },
  list: {
    gap: spacing.sm
  },
  empty: {
    fontSize: fontSizes.small,
    color: colors.muted2
  },
  error: {
    fontSize: fontSizes.small,
    color: colors.dangerText
  },
  notice: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#eef4f1'
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted2
  }
});
