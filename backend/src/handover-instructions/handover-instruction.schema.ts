import { z } from 'zod';

export const updateHandoverInstructionSchema = z
  .object({
    message: z.string().trim().max(1000).nullable().optional(),
    firstSteps: z
      .array(z.string().trim().min(1).max(180))
      .max(8)
      .refine((steps) => new Set(steps).size === steps.length, {
        message: 'firstSteps must not contain duplicate steps'
      })
  })
  .strict();

export type UpdateHandoverInstructionInput = z.infer<
  typeof updateHandoverInstructionSchema
>;
