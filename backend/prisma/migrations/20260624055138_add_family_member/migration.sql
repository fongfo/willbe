-- CreateEnum
CREATE TYPE "Relation" AS ENUM ('SELF', 'SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER');

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" "Relation" NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);
