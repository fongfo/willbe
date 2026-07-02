import type { Relation } from './familyMember.types';
import { RELATIONS } from './familyMember.types';

/** Human-readable labels for each relation, shown on chips and list rows. */
const RELATION_LABELS: Record<Relation, string> = {
  SELF: 'You',
  SPOUSE: 'Spouse',
  CHILD: 'Child',
  PARENT: 'Parent',
  SIBLING: 'Sibling',
  OTHER: 'Other'
};

export interface RelationOption {
  value: Relation;
  label: string;
}

export const RELATION_OPTIONS: RelationOption[] = RELATIONS.map((value) => ({
  value,
  label: RELATION_LABELS[value]
}));

export function getRelationLabel(relation: Relation): string {
  return RELATION_LABELS[relation];
}
