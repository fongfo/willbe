-- CreateTable
CREATE TABLE "contact_handover_view_audit_events" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "trustedContactId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "proofVersion" TEXT NOT NULL DEFAULT 'audit-proof-v1',
    "proofHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_handover_view_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_handover_view_audit_events_ownerUserId_createdAt_idx" ON "contact_handover_view_audit_events"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "contact_handover_view_audit_events_trustedContactId_createdAt_idx" ON "contact_handover_view_audit_events"("trustedContactId", "createdAt");

-- CreateIndex
CREATE INDEX "contact_handover_view_audit_events_actorUserId_idx" ON "contact_handover_view_audit_events"("actorUserId");

-- CreateIndex
CREATE INDEX "contact_handover_view_audit_events_proofHash_idx" ON "contact_handover_view_audit_events"("proofHash");

-- AddForeignKey
ALTER TABLE "contact_handover_view_audit_events" ADD CONSTRAINT "contact_handover_view_audit_events_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_handover_view_audit_events" ADD CONSTRAINT "contact_handover_view_audit_events_trustedContactId_ownerUserId_fkey" FOREIGN KEY ("trustedContactId", "ownerUserId") REFERENCES "trusted_contacts"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_handover_view_audit_events" ADD CONSTRAINT "contact_handover_view_audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
