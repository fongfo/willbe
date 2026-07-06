import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, Screen } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import { getPlanProgressLabel, PLAN_STEPS, PlanStep } from './planSteps';

interface PlanStepperScreenProps {
  onOpenStep?: (route: string) => void;
}

function defaultOpenStep(route: string): void {
  router.push(route);
}

function getStepBadgeLabel(step: PlanStep): string {
  return step.status === 'ready' ? 'Setup' : 'Review';
}

export default function PlanStepperScreen({
  onOpenStep = defaultOpenStep
}: PlanStepperScreenProps) {
  const setupSteps = PLAN_STEPS.filter((step) => step.status === 'ready').length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Plan</Text>
        <Text style={styles.lede}>
          Work through the six-step Pusaka flow, then revisit the review steps when
          your family details change.
        </Text>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryHead}>
            <View>
              <Text style={styles.summaryLabel}>Six-step flow</Text>
              <Text style={styles.summaryTitle}>{getPlanProgressLabel(setupSteps)}</Text>
            </View>
            <Badge label="MVP" tone="success" />
          </View>
          <View
            accessibilityLabel={`${setupSteps} of ${PLAN_STEPS.length} setup steps ready`}
            accessibilityRole="progressbar"
            style={styles.progressTrack}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${(setupSteps / PLAN_STEPS.length) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.summaryText}>
            Setup steps collect the handover inputs. Review steps turn them into a score
            and an emergency preview.
          </Text>
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
                      label={getStepBadgeLabel(step)}
                      tone={step.status === 'ready' ? 'success' : 'warn'}
                    />
                  </View>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        <Button
          label="Start with family"
          onPress={() => onOpenStep(PLAN_STEPS[0].route)}
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
