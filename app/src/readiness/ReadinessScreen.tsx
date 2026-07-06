import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAssetReferences } from '../asset-references/useAssetReferences';
import { Badge, Card, Screen } from '../components';
import { useFamilyMembers } from '../family-members/useFamilyMembers';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import { useTrustedContacts } from '../trusted-contacts/useTrustedContacts';
import { evaluateReadiness, GapSeverity, ReadinessLevel } from './evaluateReadiness';

function getLevelLabel(level: ReadinessLevel): string {
  if (level === 'ready') {
    return 'Ready';
  }
  if (level === 'building') {
    return 'Building';
  }
  return 'Needs work';
}

function getSeverityTone(severity: GapSeverity): 'danger' | 'warn' {
  return severity === 'high' ? 'danger' : 'warn';
}

export default function ReadinessScreen() {
  const family = useFamilyMembers();
  const contacts = useTrustedContacts();
  const assets = useAssetReferences();

  const loading = family.loading || contacts.loading || assets.loading;
  const error = family.error ?? contacts.error ?? assets.error;
  const evaluation = evaluateReadiness({
    familyMembers: family.members,
    trustedContacts: contacts.contacts,
    assetReferences: assets.references
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Readiness</Text>
        <Text style={styles.lede}>
          A practical score based on the handover details your family can act on today.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.teal} accessibilityLabel="Loading readiness" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <Card style={styles.scoreCard}>
              <View style={styles.scoreHead}>
                <View>
                  <Text style={styles.scoreLabel}>Preparedness score</Text>
                  <Text style={styles.scoreValue}>{evaluation.score}</Text>
                </View>
                <Badge label={getLevelLabel(evaluation.level)} tone={evaluation.level === 'ready' ? 'success' : 'warn'} />
              </View>

              <View
                accessibilityLabel={`Readiness score ${evaluation.score} percent`}
                accessibilityRole="progressbar"
                style={styles.progressTrack}
              >
                <View style={[styles.progressFill, { width: `${evaluation.score}%` }]} />
              </View>

              <Text style={styles.summary}>{evaluation.summary}</Text>
              <Text style={styles.checks}>
                {evaluation.completedChecks} of {evaluation.totalChecks} core checks complete
              </Text>
            </Card>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Gap list</Text>
              <Text style={styles.count}>{evaluation.gaps.length}</Text>
            </View>

            {evaluation.gaps.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No critical gaps right now</Text>
                <Text style={styles.emptyText}>
                  Keep reviewing the plan when your family, contacts, or documents change.
                </Text>
              </View>
            ) : (
              <View style={styles.gapList}>
                {evaluation.gaps.map((gap) => (
                  <Card key={gap.id} style={styles.gapCard}>
                    <View style={styles.gapHead}>
                      <Text style={styles.gapTitle}>{gap.title}</Text>
                      <Badge
                        label={gap.severity === 'high' ? 'High' : 'Medium'}
                        tone={getSeverityTone(gap.severity)}
                      />
                    </View>
                    <Text style={styles.gapDetail}>{gap.detail}</Text>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
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
  error: {
    fontSize: fontSizes.small,
    color: colors.dangerText
  },
  scoreCard: {
    gap: spacing.md
  },
  scoreHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted
  },
  scoreValue: {
    marginTop: spacing.xs,
    fontSize: 54,
    lineHeight: 60,
    fontWeight: '800',
    color: colors.ink
  },
  progressTrack: {
    height: 10,
    overflow: 'hidden',
    borderRadius: radii.pill,
    backgroundColor: colors.borderSoft
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.teal
  },
  summary: {
    fontSize: fontSizes.lead,
    lineHeight: 22,
    color: colors.ink
  },
  checks: {
    fontSize: fontSizes.small,
    color: colors.muted2
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm
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
  gapList: {
    gap: spacing.sm
  },
  gapCard: {
    gap: spacing.sm
  },
  gapHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  gapTitle: {
    flex: 1,
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.ink
  },
  gapDetail: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.muted2
  },
  empty: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.successBg
  },
  emptyTitle: {
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.successText
  },
  emptyText: {
    marginTop: spacing.xs,
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.ink
  }
});
