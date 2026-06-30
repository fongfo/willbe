import { z } from 'zod';

// An owner reference identifies whose wallet this is (e.g. a plan or user id). There
// is no auth/user scoping yet, so the caller supplies an opaque, non-empty reference.
const ownerRef = z.string().trim().min(1, 'ownerRef is required').max(200);

export const createWalletSchema = z
  .object({
    ownerRef
  })
  .strict();

export type CreateWalletInput = z.infer<typeof createWalletSchema>;

export const ownerRefParamSchema = z.object({
  ownerRef
});
