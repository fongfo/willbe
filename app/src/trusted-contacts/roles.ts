import type { ContactRole } from './trustedContact.types';
import { CONTACT_ROLES } from './trustedContact.types';

const ROLE_LABELS: Record<ContactRole, string> = {
  PRIMARY: 'Primary',
  BACKUP: 'Backup'
};

export interface RoleOption {
  value: ContactRole;
  label: string;
}

export const ROLE_OPTIONS: RoleOption[] = CONTACT_ROLES.map((value) => ({
  value,
  label: ROLE_LABELS[value]
}));

export function getRoleLabel(role: ContactRole): string {
  return ROLE_LABELS[role];
}
