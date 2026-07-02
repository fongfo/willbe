import { z } from 'zod';
import { RELATIONS } from '../family-members/familyMember.types';
import { CONTACT_ROLES } from './trustedContact.types';

// Matches the backend phone rule (E.164-ish: optional +, 8–15 digits).
const PHONE_PATTERN = /^\+?[1-9]\d{7,14}$/;

function emptyToUndefined(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

/**
 * Validates the add-contact form at the input boundary, matching the backend
 * Zod schema so the client fails fast with the same rules the API enforces.
 */
export const trustedContactFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
  relation: z.enum(RELATIONS),
  role: z.enum(CONTACT_ROLES),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, 'Enter a valid phone number'),
  email: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined,
    z.string().email('Enter a valid email').optional()
  ),
  detail: z
    .string()
    .trim()
    .max(280, 'Detail is too long')
    .optional()
    .transform((value) => emptyToUndefined(value))
});

export type TrustedContactFormValues = z.infer<typeof trustedContactFormSchema>;
