-- CreateEnum
CREATE TYPE "EmergencyAccessReason" AS ENUM ('ACCIDENT', 'DEATH', 'SERIOUS_ILLNESS', 'UNREACHABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "EmergencyAccessStatus" AS ENUM ('REQUESTED', 'COOLING_OFF', 'SECONDARY_REVIEW', 'ACTIVE', 'DENIED', 'REJECTED_BY_OWNER', 'SUSPENDED', 'CLOSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "emergency_access_requests" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "trustedContactId" TEXT NOT NULL,
    "requesterUserId" TEXT,
    "reason" "EmergencyAccessReason" NOT NULL,
    "reasonDetail" TEXT,
    "status" "EmergencyAccessStatus" NOT NULL DEFAULT 'REQUESTED',
    "ownerNotifiedAt" TIMESTAMP(3),
    "coolingOffEndsAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_access_audit_events" (
    "id" TEXT NOT NULL,
    "accessRequestId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_access_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emergency_access_requests_ownerUserId_status_idx" ON "emergency_access_requests"("ownerUserId", "status");

-- CreateIndex
CREATE INDEX "emergency_access_requests_trustedContactId_status_idx" ON "emergency_access_requests"("trustedContactId", "status");

-- CreateIndex
CREATE INDEX "emergency_access_requests_requesterUserId_status_idx" ON "emergency_access_requests"("requesterUserId", "status");

-- CreateIndex
CREATE INDEX "emergency_access_audit_events_accessRequestId_createdAt_idx" ON "emergency_access_audit_events"("accessRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "emergency_access_audit_events_actorUserId_idx" ON "emergency_access_audit_events"("actorUserId");

-- AddForeignKey
ALTER TABLE "emergency_access_requests" ADD CONSTRAINT "emergency_access_requests_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_access_requests" ADD CONSTRAINT "emergency_access_requests_trustedContactId_fkey" FOREIGN KEY ("trustedContactId") REFERENCES "trusted_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_access_requests" ADD CONSTRAINT "emergency_access_requests_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_access_audit_events" ADD CONSTRAINT "emergency_access_audit_events_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "emergency_access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_access_audit_events" ADD CONSTRAINT "emergency_access_audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
