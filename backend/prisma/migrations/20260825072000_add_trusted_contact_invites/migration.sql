ALTER TABLE "trusted_contacts"
  ADD COLUMN "inviteTokenHash" TEXT,
  ADD COLUMN "inviteTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "inviteTokenUsedAt" TIMESTAMP(3),
  ADD COLUMN "inviteSentAt" TIMESTAMP(3);

CREATE INDEX "trusted_contacts_inviteTokenHash_idx" ON "trusted_contacts"("inviteTokenHash");
