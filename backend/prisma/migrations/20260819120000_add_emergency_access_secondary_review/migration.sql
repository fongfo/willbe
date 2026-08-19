CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS');

CREATE TABLE "emergency_access_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requireBackupConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_access_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "emergency_access_audit_events"
ADD COLUMN "proofVersion" TEXT NOT NULL DEFAULT 'audit-proof-v1',
ADD COLUMN "proofHash" TEXT;

CREATE TABLE "emergency_access_notification_events" (
    "id" TEXT NOT NULL,
    "accessRequestId" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "trustedContactId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_access_notification_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "emergency_access_settings_userId_key" ON "emergency_access_settings"("userId");
CREATE INDEX "emergency_access_audit_events_proofHash_idx" ON "emergency_access_audit_events"("proofHash");
CREATE INDEX "emergency_access_notification_events_accessRequestId_eventType_idx" ON "emergency_access_notification_events"("accessRequestId", "eventType");
CREATE INDEX "emergency_access_notification_events_recipientUserId_idx" ON "emergency_access_notification_events"("recipientUserId");
CREATE INDEX "emergency_access_notification_events_trustedContactId_idx" ON "emergency_access_notification_events"("trustedContactId");

ALTER TABLE "emergency_access_settings" ADD CONSTRAINT "emergency_access_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "emergency_access_notification_events" ADD CONSTRAINT "emergency_access_notification_events_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "emergency_access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "emergency_access_notification_events" ADD CONSTRAINT "emergency_access_notification_events_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "emergency_access_notification_events" ADD CONSTRAINT "emergency_access_notification_events_trustedContactId_fkey" FOREIGN KEY ("trustedContactId") REFERENCES "trusted_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
