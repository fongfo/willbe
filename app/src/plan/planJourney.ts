import type { Href } from 'expo-router';
import type { ReadinessEvaluation } from '../readiness/evaluateReadiness';
import type { PlanSetupProgress } from './planProgress';

export type PlanJourneyState = 'start' | 'continue' | 'fix-gap' | 'complete';

export interface PlanJourneyAction {
  title: string;
  detail: string;
  label: string;
  route: Href;
  state: PlanJourneyState;
}

export function isPlanComplete(
  progress: PlanSetupProgress,
  evaluation: ReadinessEvaluation
): boolean {
  return progress.completedSetupSteps === 4 && evaluation.gaps.length === 0;
}

export function getSetupJourneyAction(
  progress: PlanSetupProgress
): PlanJourneyAction {
  if (!progress.hasFamilyMembers) {
    return {
      title: 'Add family details',
      detail: 'Start by naming who this handover is meant to protect.',
      label: 'Start setup',
      route: '/family-members',
      state: 'start'
    };
  }

  if (!progress.hasTrustedContacts) {
    return {
      title: 'Add trusted contacts',
      detail: 'Choose who your family should call first, plus a backup.',
      label: 'Continue setup',
      route: '/trusted-contacts',
      state: 'continue'
    };
  }

  if (!progress.hasAssetReferences) {
    return {
      title: 'Add asset references',
      detail: 'Point your family to where important records can be found.',
      label: 'Continue setup',
      route: '/asset-references',
      state: 'continue'
    };
  }

  if (!progress.hasCheckInSetup) {
    return {
      title: 'Set check-in and cloud',
      detail: 'Choose the review rhythm and connect the folder label your family uses.',
      label: 'Continue setup',
      route: '/check-in',
      state: 'continue'
    };
  }

  return {
    title: 'Review readiness',
    detail: 'Your setup inputs are in place. Review the remaining handover gaps.',
    label: 'Review readiness',
    route: '/readiness',
    state: 'continue'
  };
}

export function getPlanJourneyAction(
  progress: PlanSetupProgress,
  evaluation: ReadinessEvaluation
): PlanJourneyAction {
  const setupAction = getSetupJourneyAction(progress);

  if (setupAction.route !== '/readiness') {
    return setupAction;
  }

  const [firstGap] = evaluation.gaps;
  if (firstGap) {
    return {
      title: firstGap.title,
      detail: firstGap.detail,
      label: 'Fix next gap',
      route: firstGap.action.route,
      state: 'fix-gap'
    };
  }

  return {
    title: 'Plan complete',
    detail: 'Your setup and core handover checks are complete. Preview what your family would see.',
    label: 'Preview handover',
    route: '/emergency-handover',
    state: 'complete'
  };
}
