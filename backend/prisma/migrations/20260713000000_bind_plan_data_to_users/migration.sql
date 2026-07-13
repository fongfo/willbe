-- Bind all plan data to authenticated users. Existing global rows are preserved
-- under a migration user so staging/test data can survive the NOT NULL change.
INSERT INTO "users" ("id", "privyUserId", "email", "name", "walletAddress", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-4000-8000-000000000046',
  'migration:wb-46-global-plan',
  NULL,
  'Migrated global plan data',
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("privyUserId") DO NOTHING;

ALTER TABLE "family_members" ADD COLUMN "userId" TEXT;
ALTER TABLE "trusted_contacts" ADD COLUMN "userId" TEXT;
ALTER TABLE "asset_references" ADD COLUMN "userId" TEXT;
ALTER TABLE "review_settings" ADD COLUMN "userId" TEXT;

UPDATE "family_members"
SET "userId" = '00000000-0000-4000-8000-000000000046'
WHERE "userId" IS NULL;

UPDATE "trusted_contacts"
SET "userId" = '00000000-0000-4000-8000-000000000046'
WHERE "userId" IS NULL;

UPDATE "asset_references"
SET "userId" = '00000000-0000-4000-8000-000000000046'
WHERE "userId" IS NULL;

UPDATE "review_settings"
SET "userId" = '00000000-0000-4000-8000-000000000046'
WHERE "userId" IS NULL;

ALTER TABLE "family_members" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "trusted_contacts" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "asset_references" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "review_settings" ALTER COLUMN "userId" SET NOT NULL;

CREATE UNIQUE INDEX "family_members_id_userId_key" ON "family_members"("id", "userId");
CREATE INDEX "family_members_userId_idx" ON "family_members"("userId");

CREATE UNIQUE INDEX "trusted_contacts_id_userId_key" ON "trusted_contacts"("id", "userId");
CREATE INDEX "trusted_contacts_userId_idx" ON "trusted_contacts"("userId");

CREATE UNIQUE INDEX "asset_references_id_userId_key" ON "asset_references"("id", "userId");
CREATE INDEX "asset_references_userId_idx" ON "asset_references"("userId");

CREATE UNIQUE INDEX "review_settings_userId_key" ON "review_settings"("userId");

ALTER TABLE "family_members"
ADD CONSTRAINT "family_members_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trusted_contacts"
ADD CONSTRAINT "trusted_contacts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "asset_references"
ADD CONSTRAINT "asset_references_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_settings"
ADD CONSTRAINT "review_settings_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
