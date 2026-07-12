import { z } from 'zod';

export const authSessionBodySchema = z.object({
  accessToken: z.string().trim().min(1, 'Access token is required').optional(),
  identityToken: z.string().trim().min(1, 'Identity token is required').optional()
});

export type AuthSessionBody = z.infer<typeof authSessionBodySchema>;
