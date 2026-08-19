CREATE TABLE "handover_instructions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "message" TEXT,
  "firstSteps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "handover_instructions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "handover_instructions_userId_key" ON "handover_instructions"("userId");

ALTER TABLE "handover_instructions"
  ADD CONSTRAINT "handover_instructions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
