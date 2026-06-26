import { z } from 'zod';
import { AssetCategory } from '../generated/prisma/enums';

export const createAssetReferenceSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    category: z.nativeEnum(AssetCategory),
    locationHint: z.string().trim().max(280).nullable().optional(),
    detail: z.string().trim().max(280).nullable().optional()
  })
  .strict();

export const updateAssetReferenceSchema = createAssetReferenceSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  });

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export type CreateAssetReferenceInput = z.infer<typeof createAssetReferenceSchema>;
export type UpdateAssetReferenceInput = z.infer<typeof updateAssetReferenceSchema>;
