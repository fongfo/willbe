import { z } from 'zod';
import { ASSET_CATEGORIES } from './assetReference.types';

function emptyToUndefined(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

/**
 * Validates the add-reference form at the input boundary. Bounds match the
 * backend Zod schema (name 1–120, locationHint/detail ≤280). Deliberately
 * captures only the name, category and where-to-look hint — no account
 * numbers, balances or passwords.
 */
export const assetReferenceFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
  category: z.enum(ASSET_CATEGORIES),
  locationHint: z
    .string()
    .trim()
    .max(280, 'Location hint is too long')
    .optional()
    .transform((value) => emptyToUndefined(value)),
  detail: z
    .string()
    .trim()
    .max(280, 'Detail is too long')
    .optional()
    .transform((value) => emptyToUndefined(value))
});

export type AssetReferenceFormValues = z.infer<typeof assetReferenceFormSchema>;
