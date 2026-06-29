import { z } from 'zod';
import { CheckInFrequency, CloudProvider } from '../generated/prisma/enums';

// PUT replaces the whole singleton, so both fields are required. `connectedProviders`
// may be empty (no cloud drives linked) but must not contain duplicates.
export const updateReviewSettingSchema = z
  .object({
    checkInFrequency: z.nativeEnum(CheckInFrequency),
    connectedProviders: z
      .array(z.nativeEnum(CloudProvider))
      .max(4)
      .refine((providers) => new Set(providers).size === providers.length, {
        message: 'connectedProviders must not contain duplicate providers'
      })
  })
  .strict();

export type UpdateReviewSettingInput = z.infer<typeof updateReviewSettingSchema>;
