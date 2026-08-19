import { Href, router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAssetReferences } from '../asset-references/useAssetReferences';
import { Badge, Button, Card, Screen } from '../components';
import { useFamilyMembers } from '../family-members/useFamilyMembers';
import { useRefreshOnFocus } from '../navigation/useRefreshOnFocus';
import { getPlanJourneyAction } from '../plan/planJourney';
import { usePlanProgress } from '../plan/usePlanProgress';
import { evaluateReadiness } from '../readiness/evaluateReadiness';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import { useTrustedContacts } from '../trusted-contacts/useTrustedContacts';
import { getDashboardMetrics } from './homeDashboard';

interface HomeDashboardScreenProps {
  onNavigate?: (route: Href) => void;
}

function defaultNavigate(route: Href): void {
  router.push(route);
}

export default function HomeDashboardScreen({
  onNavigate = defaultNavigate
}: HomeDashboardScreenProps) {
  const family = useFamilyMembers();
  const contacts = useTrustedContacts();
  const assets = useAssetReferences();
  const planProgress = usePlanProgress();
  useRefreshOnFocus(family.refresh);
  useRefreshOnFocus(contacts.refresh);
  useRefreshOnFocus(assets.refresh);
  useRefreshOnFocus(planProgress.refresh);

  const loading = family.loading || contacts.loading || assets.loading || planProgress.loading;
  const error = family.error ?? contacts.error ?? assets.error ?? planProgress.error;
  const evaluation = evaluateReadiness({
    familyMembers: family.members,
    trustedContacts: contacts.contacts,
    assetReferences: assets.references
  });
  const nextAction = getPlanJourneyAction(planProgress.progress, evaluation);
  const metrics = getDashboardMetrics({
    familyMembers: family.members,
    trustedContacts: contacts.contacts,
    assetReferences: assets.references
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.heading}>Home</Text>
          <Badge label="Dashboard" tone="success" />
        </View>
        <Text style={styles.lede}>
          A quick view of the people, contacts, and asset references that make the
          Pusaka handover usable.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.teal} accessibilityLabel="Loading dashboard" />
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
                <Text style={styles.checks}>
                  {evaluation.completedChecks}/{evaluation.totalChecks} checks
                </Text>
              </View>
              <View
                accessibilityLabel={`Home readiness score ${evaluation.score} percent`}
                accessibilityRole="progressbar"
                style={styles.progressTrack}
              >
                <View style={[styles.progressFill, { width: `${evaluation.score}%` }]} />
              </View>
              <Text style={styles.summary}>{evaluation.summary}</Text>
            </Card>

            <View style={styles.metrics}>
              {metrics.map((metric) => (
                <Card key={metric.id} style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricDetail}>{metric.detail}</Text>
                </Card>
              ))}
            </View>

            <Card style={styles.nextCard}>
              <Text style={styles.sectionLabel}>
                {nextAction.state === 'complete' ? 'Complete' : 'Next best action'}
              </Text>
              <Text style={styles.nextTitle}>{nextAction.title}</Text>
              <Text style={styles.nextDetail}>{nextAction.detail}</Text>
              <Button
                label={nextAction.label}
                onPress={() => onNavigate(nextAction.route)}
                style={styles.nextButton}
              />
            </Card>

            <View style={styles.actions}>
              <Button
                label={nextAction.state === 'complete' ? 'View completed plan' : 'View plan'}
                onPress={() => onNavigate('/plan')}
                variant="secondary"
              />
              <Button
                label="Review readiness"
                onPress={() => onNavigate('/readiness')}
                variant="secondary"
              />
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  heading: {
    flex: 1,
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
  checks: {
    fontSize: fontSizes.small,
    color: colors.teal,
    fontWeight: '700'
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
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  metricCard: {
    flex: 1,
    minHeight: 118,
    gap: spacing.xs,
    padding: spacing.md
  },
  metricLabel: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted
  },
  metricValue: {
    fontSize: fontSizes.display,
    fontWeight: '800',
    color: colors.ink
  },
  metricDetail: {
    fontSize: fontSizes.caption,
    lineHeight: 15,
    color: colors.muted2
  },
  nextCard: {
    gap: spacing.sm
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted
  },
  nextTitle: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.ink
  },
  nextDetail: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.muted2
  },
  nextButton: {
    marginTop: spacing.xs
  },
  actions: {
    gap: spacing.sm
  }
});
