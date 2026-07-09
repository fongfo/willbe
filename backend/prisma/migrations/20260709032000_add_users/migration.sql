-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_privyUserId_key" ON "users"("privyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");
