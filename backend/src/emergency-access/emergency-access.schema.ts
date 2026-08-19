import { z } from 'zod';
import { EmergencyAccessReason } from '../generated/prisma/enums';

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const createEmergencyAccessRequestSchema = z
  .object({
    ownerUserId: z.string().uuid(),
    trustedContactId: z.string().uuid(),
    reason: z.nativeEnum(EmergencyAccessReason),
    reasonDetail: z.string().trim().max(500).nullable().optional(),
    confirmed: z.literal(true)
  })
  .strict();

export type CreateEmergencyAccessRequestInput = z.infer<
  typeof createEmergencyAccessRequestSchema
>;
