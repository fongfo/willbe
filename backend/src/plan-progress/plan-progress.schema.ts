import { z } from 'zod';

export const planProgressSchema = z.object({
  completedSetupSteps: z.number().int().min(0).max(4),
  hasFamilyMembers: z.boolean(),
  hasTrustedContacts: z.boolean(),
  hasAssetReferences: z.boolean(),
  hasCheckInSetup: z.boolean()
});

export type PlanProgress = z.infer<typeof planProgressSchema>;
