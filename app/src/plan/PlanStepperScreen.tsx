import { Href, router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, Screen } from '../components';
import { useRefreshOnFocus } from '../navigation/useRefreshOnFocus';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import { getSetupJourneyAction } from './planJourney';
import type { PlanSetupProgress } from './planProgress';
import { getPlanProgressLabel, PLAN_STEPS, REVIEW_OUTPUTS, SETUP_STEPS } from './planSteps';
import type { PlanStep } from './planSteps';
import { usePlanProgress } from './usePlanProgress';

interface PlanStepperScreenProps {
  onOpenStep?: (route: Href) => void;
  setupProgress?: PlanSetupProgress;
  loading?: boolean;
}

function defaultOpenStep(route: Href): void {
  router.push(route);
}

function getStepBadgeLabel(step: PlanStep): string {
  return step.status === 'ready' ? 'Setup' : 'Review';
}

function getStepComplete(progress: PlanSetupProgress, step: PlanStep): boolean {
  if (step.id === 'family-members') {
    return progress.hasFamilyMembers;
  }
  if (step.id === 'trusted-contacts') {
    return progress.hasTrustedContacts;
  }
  if (step.id === 'asset-references') {
    return progress.hasAssetReferences;
  }
  if (step.id === 'check-in') {
    return progress.hasCheckInSetup;
  }
  return false;
}

export default function PlanStepperScreen({
  onOpenStep = defaultOpenStep,
  setupProgress,
  loading
}: PlanStepperScreenProps) {
  const planProgress = usePlanProgress();
  useRefreshOnFocus(planProgress.refresh);
  const effectiveLoading = loading ?? planProgress.loading;
  const progress = setupProgress ?? planProgress.progress;
  const setupSteps = progress.completedSetupSteps;
  const setupComplete = setupSteps === SETUP_STEPS.length;
  const nextAction = getSetupJourneyAction(progress);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Plan</Text>
        <Text style={styles.lede}>
          Work through the setup checklist, then use the review outputs when your
          family details change.
        </Text>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryHead}>
            <View>
              <Text style={styles.summaryLabel}>Setup checklist</Text>
              <Text style={styles.summaryTitle}>{getPlanProgressLabel(setupSteps)}</Text>
            </View>
            <Badge label={setupComplete ? 'Complete' : 'In progress'} tone={setupComplete ? 'success' : 'warn'} />
          </View>
          <View
            accessibilityLabel={`${setupSteps} of ${SETUP_STEPS.length} setup steps ready`}
            accessibilityRole="progressbar"
            style={styles.progressTrack}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${(setupSteps / SETUP_STEPS.length) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.summaryText}>
            Setup inputs collect the handover details. Review outputs turn those
            inputs into a score and emergency preview.
          </Text>
          {effectiveLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.teal} accessibilityLabel="Loading plan progress" />
              <Text style={styles.loadingText}>Loading setup progress</Text>
            </View>
          ) : null}
          <View style={styles.summaryMetrics}>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricValue}>{setupSteps}</Text>
              <Text style={styles.metricLabel}>Setup inputs</Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricValue}>{REVIEW_OUTPUTS.length}</Text>
              <Text style={styles.metricLabel}>Review outputs</Text>
            </View>
          </View>
        </Card>

        <View style={styles.stepList}>
          {PLAN_STEPS.map((step) => (
            <Pressable
              key={step.id}
              accessibilityLabel={`Open step ${step.stepNumber}: ${step.title}`}
              accessibilityRole="button"
              onPress={() => onOpenStep(step.route)}
              style={styles.stepPressable}
            >
              <Card style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
                </View>
                <View style={styles.stepCopy}>
                  <View style={styles.stepHead}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Badge
                      label={
                        step.status === 'ready' && getStepComplete(progress, step)
                          ? 'Done'
                          : getStepBadgeLabel(step)
                      }
                      tone={
                        step.status === 'ready' && getStepComplete(progress, step)
                          ? 'success'
                          : 'warn'
                      }
                    />
                  </View>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        <Button
          label={nextAction.label}
          onPress={() => onOpenStep(nextAction.route)}
          style={styles.primaryAction}
        />
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
  summaryCard: {
    gap: spacing.md
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted
  },
  summaryTitle: {
    marginTop: spacing.xs,
    fontSize: fontSizes.title,
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
  summaryText: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.muted2
  },
  loadingRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  loadingText: {
    fontSize: fontSizes.small,
    color: colors.muted2
  },
  summaryMetrics: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  summaryMetric: {
    flex: 1,
    minHeight: 72,
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.successBg,
    padding: spacing.md
  },
  metricValue: {
    fontSize: fontSizes.display,
    fontWeight: '800',
    color: colors.ink
  },
  metricLabel: {
    marginTop: spacing.xs,
    fontSize: fontSizes.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted2
  },
  stepList: {
    gap: spacing.sm
  },
  stepPressable: {
    minHeight: 88
  },
  stepCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md
  },
  stepNumber: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink
  },
  stepNumberText: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.white
  },
  stepCopy: {
    flex: 1,
    gap: spacing.xs
  },
  stepHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  stepTitle: {
    flex: 1,
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.ink
  },
  stepDescription: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.muted2
  },
  primaryAction: {
    marginTop: spacing.sm
  }
});
