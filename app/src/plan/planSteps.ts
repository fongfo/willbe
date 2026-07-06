export type PlanStepStatus = 'ready' | 'review';

export interface PlanStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  route: string;
  status: PlanStepStatus;
}

export const PLAN_STEPS: PlanStep[] = [
  {
    id: 'family-members',
    stepNumber: 1,
    title: 'Family members',
    description: 'Name who the plan is meant to protect.',
    route: '/family-members',
    status: 'ready'
  },
  {
    id: 'trusted-contacts',
    stepNumber: 2,
    title: 'Trusted contacts',
    description: 'Choose a primary helper and at least one backup.',
    route: '/trusted-contacts',
    status: 'ready'
  },
  {
    id: 'asset-references',
    stepNumber: 3,
    title: 'Asset references',
    description: 'Record where to look without storing sensitive details.',
    route: '/asset-references',
    status: 'ready'
  },
  {
    id: 'check-in',
    stepNumber: 4,
    title: 'Check-in and cloud',
    description: 'Set the review rhythm and connect a document folder.',
    route: '/check-in',
    status: 'ready'
  },
  {
    id: 'readiness',
    stepNumber: 5,
    title: 'Readiness review',
    description: 'See the score and close the most important gaps.',
    route: '/readiness',
    status: 'review'
  },
  {
    id: 'emergency-handover',
    stepNumber: 6,
    title: 'Emergency handover',
    description: 'Preview what your family can use in a stressful moment.',
    route: '/emergency-handover',
    status: 'review'
  }
];

export function getPlanProgressLabel(completedSteps: number): string {
  return `${completedSteps} of ${PLAN_STEPS.length} steps ready`;
}
