import { z } from 'zod';

const ownerRef = z.string().trim().min(1, 'ownerRef is required').max(200);

export const anchorPlanSchema = z
  .object({
    ownerRef,
    snapshot: z
      .record(z.string(), z.unknown())
      .refine((value) => Object.keys(value).length > 0, {
        message: 'snapshot must contain at least one field'
      })
  })
  .strict();

export type AnchorPlanSchemaInput = z.infer<typeof anchorPlanSchema>;

export const ownerRefParamSchema = z.object({
  ownerRef
});

