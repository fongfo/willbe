import type { TrustedContact } from './trustedContact.types';

export type ContactsLevel = 'warn' | 'success';

export interface ContactsEvaluation {
  level: ContactsLevel;
  message: string;
  /** At least two contacts recorded — the core resilience rule. */
  hasEnough: boolean;
  /** At least one contact designated PRIMARY. */
  hasPrimary: boolean;
}

const MINIMUM_CONTACTS = 2;

/**
 * Evaluates the "at least two trusted contacts" rule so no one is a single
 * point of failure, and nudges toward designating a primary. Pure so the
 * guidance banner is trivially testable.
 */
export function evaluateContacts(
  contacts: readonly TrustedContact[]
): ContactsEvaluation {
  const hasEnough = contacts.length >= MINIMUM_CONTACTS;
  const hasPrimary = contacts.some((contact) => contact.role === 'PRIMARY');

  if (contacts.length === 0) {
    return {
      level: 'warn',
      hasEnough,
      hasPrimary,
      message: 'Add at least two trusted contacts so no one is a single point of failure.'
    };
  }

  if (!hasEnough) {
    return {
      level: 'warn',
      hasEnough,
      hasPrimary,
      message: 'Add one more — we suggest at least two, so no one is a single point of failure.'
    };
  }

  if (!hasPrimary) {
    return {
      level: 'warn',
      hasEnough,
      hasPrimary,
      message: 'Mark one of your contacts as primary.'
    };
  }

  return {
    level: 'success',
    hasEnough,
    hasPrimary,
    message: 'Great — your family has enough trusted contacts.'
  };
}
