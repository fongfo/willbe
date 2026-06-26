-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('BANK', 'INSURANCE', 'PROPERTY', 'INVESTMENT', 'CRYPTO', 'OTHER');

-- CreateTable
CREATE TABLE "asset_references" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "locationHint" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_references_pkey" PRIMARY KEY ("id")
);
