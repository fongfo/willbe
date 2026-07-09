import { z } from 'zod';

export const verifiedAuthUserSchema = z.object({
  privyUserId: z.string().min(1, 'Privy user id is required'),
  email: z.string().email('Email must be valid').optional(),
  name: z.string().trim().min(1, 'Name is required').optional(),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Wallet address must be a valid EVM address')
    .optional()
});

export type VerifiedAuthUser = z.infer<typeof verifiedAuthUserSchema>;
