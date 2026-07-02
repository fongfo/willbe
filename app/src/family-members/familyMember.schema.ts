import { z } from 'zod';
import { RELATIONS } from './familyMember.types';

/**
 * Validates the add-member form at the input boundary. Bounds match the
 * backend Zod schema (name 1–120, detail ≤280) so the client fails fast with
 * the same rules the API enforces.
 */
export const familyMemberFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
  relation: z.enum(RELATIONS),
  detail: z
    .string()
    .trim()
    .max(280, 'Detail is too long')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
});

export type FamilyMemberFormValues = z.infer<typeof familyMemberFormSchema>;
