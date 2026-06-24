import { z } from 'zod';
import { Relation } from '../generated/prisma/enums';

export const createFamilyMemberSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    relation: z.nativeEnum(Relation),
    detail: z.string().trim().max(280).nullable().optional()
  })
  .strict();

export const updateFamilyMemberSchema = createFamilyMemberSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  });

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberSchema>;
