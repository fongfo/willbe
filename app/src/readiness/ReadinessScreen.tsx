import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAssetReferences } from '../asset-references/useAssetReferences';
import { Badge, Card, Screen } from '../components';
import { useFamilyMembers } from '../family-members/useFamilyMembers';
import { useRefreshOnFocus } from '../navigation/useRefreshOnFocus';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import { useTrustedContacts } from '../trusted-contacts/useTrustedContacts';
import { evaluateReadiness, GapSeverity, ReadinessLevel } from './evaluateReadiness';
import type { GapUrgency } from './gapExplanations.types';
import { useGapExplanations } from './useGapExplanations';

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

function getUrgencyLabel(urgency: GapUrgency): string {
  if (urgency === 'do_first') {
    return 'Do first';
  }
  if (urgency === 'do_next') {
    return 'Do next';
  }
  return 'Do later';
}

function getUrgencyTone(urgency: GapUrgency): 'danger' | 'warn' | 'success' {
  if (urgency === 'do_first') {
    return 'danger';
  }
  if (urgency === 'do_next') {
    return 'warn';
  }
  return 'success';
}

export default function ReadinessScreen() {
  const family = useFamilyMembers();
  const contacts = useTrustedContacts();
  const assets = useAssetReferences();
  useRefreshOnFocus(family.refresh);
  useRefreshOnFocus(contacts.refresh);
  useRefreshOnFocus(assets.refresh);

  const loading = family.loading || contacts.loading || assets.loading;
  const error = family.error ?? contacts.error ?? assets.error;
  const evaluation = evaluateReadiness({
    familyMembers: family.members,
    trustedContacts: contacts.contacts,
    assetReferences: assets.references
  });
  const explanation = useGapExplanations(evaluation, !loading && !error);

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

            {evaluation.gaps.length > 0 ? (
              <Card style={styles.analysisCard}>
                <View style={styles.analysisHead}>
                  <View>
                    <Text style={styles.sectionTitle}>Priority plan</Text>
                    <Text style={styles.analysisKicker}>AI gap analysis</Text>
                  </View>
                  {explanation.data ? (
                    <Badge
                      label={explanation.data.provider.name === 'fallback' ? 'Fallback' : 'AI'}
                      tone={explanation.data.provider.name === 'fallback' ? 'warn' : 'success'}
                    />
                  ) : null}
                </View>

                {explanation.loading ? (
                  <View style={styles.analysisLoading}>
                    <ActivityIndicator color={colors.teal} accessibilityLabel="Loading gap analysis" />
                    <Text style={styles.analysisMuted}>Building your priority plan...</Text>
                  </View>
                ) : explanation.error ? (
                  <Text style={styles.error}>{explanation.error}</Text>
                ) : explanation.data ? (
                  <>
                    <Text style={styles.analysisSummary}>{explanation.data.summary}</Text>
                    <View style={styles.recommendationList}>
                      {explanation.data.recommendations.map((item) => (
                        <View key={item.gapId} style={styles.recommendation}>
                          <View style={styles.recommendationHead}>
                            <Text style={styles.recommendationTitle}>{item.title}</Text>
                            <Badge
                              label={getUrgencyLabel(item.urgency)}
                              tone={getUrgencyTone(item.urgency)}
                            />
                          </View>
                          <Text style={styles.recommendationText}>{item.explanation}</Text>
                          <Text style={styles.nextAction}>{item.nextAction.label}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.policyText}>
                      Product guidance only. Not financial, legal, or insurance advice.
                    </Text>
                  </>
                ) : null}
              </Card>
            ) : null}

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
  analysisCard: {
    gap: spacing.md
  },
  analysisHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  analysisKicker: {
    marginTop: spacing.xs,
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.ink
  },
  analysisLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  analysisMuted: {
    flex: 1,
    fontSize: fontSizes.small,
    color: colors.muted2
  },
  analysisSummary: {
    fontSize: fontSizes.lead,
    lineHeight: 22,
    color: colors.ink
  },
  recommendationList: {
    gap: spacing.sm
  },
  recommendation: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  recommendationHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  recommendationTitle: {
    flex: 1,
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.ink
  },
  recommendationText: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.muted2
  },
  nextAction: {
    fontSize: fontSizes.small,
    fontWeight: '700',
    color: colors.teal
  },
  policyText: {
    fontSize: fontSizes.caption,
    lineHeight: 16,
    color: colors.muted
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
