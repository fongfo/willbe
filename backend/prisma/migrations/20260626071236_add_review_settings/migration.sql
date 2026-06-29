-- CreateEnum
CREATE TYPE "CheckInFrequency" AS ENUM ('EVERY_3_MONTHS', 'EVERY_6_MONTHS', 'EVERY_12_MONTHS', 'CUSTOM_ANNUAL');

-- CreateEnum
CREATE TYPE "CloudProvider" AS ENUM ('GOOGLE_DRIVE', 'ONEDRIVE', 'DROPBOX', 'ICLOUD');

-- CreateTable
CREATE TABLE "review_settings" (
    "id" TEXT NOT NULL,
    "checkInFrequency" "CheckInFrequency" NOT NULL DEFAULT 'EVERY_6_MONTHS',
    "connectedProviders" "CloudProvider"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_settings_pkey" PRIMARY KEY ("id")
);
