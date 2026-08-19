ALTER TABLE "trusted_contacts" ADD COLUMN "contactUserId" TEXT;

CREATE INDEX "trusted_contacts_contactUserId_idx" ON "trusted_contacts"("contactUserId");

ALTER TABLE "trusted_contacts"
  ADD CONSTRAINT "trusted_contacts_contactUserId_fkey"
  FOREIGN KEY ("contactUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
