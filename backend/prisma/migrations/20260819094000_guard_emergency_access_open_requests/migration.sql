-- Only one non-terminal emergency access request may be open for a contact at once.
CREATE UNIQUE INDEX "emergency_access_requests_trustedContactId_open_unique"
ON "emergency_access_requests"("trustedContactId")
WHERE "status" IN ('REQUESTED', 'COOLING_OFF', 'SECONDARY_REVIEW', 'ACTIVE');

-- Ensure the request owner matches the owner of the selected trusted contact.
ALTER TABLE "emergency_access_requests" DROP CONSTRAINT "emergency_access_requests_trustedContactId_fkey";

ALTER TABLE "emergency_access_requests"
ADD CONSTRAINT "emergency_access_requests_trustedContactId_ownerUserId_fkey"
FOREIGN KEY ("trustedContactId", "ownerUserId")
REFERENCES "trusted_contacts"("id", "userId")
ON DELETE CASCADE
ON UPDATE CASCADE;
