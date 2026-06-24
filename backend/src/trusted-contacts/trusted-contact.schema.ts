import { z } from 'zod';
import { Relation, ContactRole } from '../generated/prisma/enums';

const PHONE_PATTERN = /^\+?[1-9]\d{7,14}$/;

export const createTrustedContactSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    relation: z.nativeEnum(Relation),
    role: z.nativeEnum(ContactRole),
    phone: z.string().trim().regex(PHONE_PATTERN),
    email: z.string().trim().email().nullable().optional(),
    detail: z.string().trim().max(280).nullable().optional()
  })
  .strict();

export const updateTrustedContactSchema = createTrustedContactSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  });

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export type CreateTrustedContactInput = z.infer<typeof createTrustedContactSchema>;
export type UpdateTrustedContactInput = z.infer<typeof updateTrustedContactSchema>;
