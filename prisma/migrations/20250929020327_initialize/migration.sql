-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('BUYER', 'REGISTERED', 'AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."FairnessScope" AS ENUM ('TOWN', 'PLANNING_AREA');

-- CreateEnum
CREATE TYPE "public"."FairnessTag" AS ENUM ('BELOW_TYPICAL', 'TYPICAL', 'ABOVE_TYPICAL');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'BUYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "town" TEXT NOT NULL,
    "flatType" TEXT NOT NULL,
    "flatModel" TEXT,
    "storeyRange" TEXT NOT NULL,
    "floorAreaSqm" DOUBLE PRECISION NOT NULL,
    "leaseCommenceYear" INTEGER NOT NULL,
    "remainingLeaseYears" INTEGER NOT NULL,
    "resalePrice" INTEGER NOT NULL,
    "pricePerSqm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SavedSearch" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "sort" TEXT NOT NULL,
    "trendWindow" INTEGER NOT NULL,
    "shortUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Aggregate" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "town" TEXT NOT NULL,
    "flatType" TEXT NOT NULL,
    "medianPrice" DOUBLE PRECISION NOT NULL,
    "medianPPSM" DOUBLE PRECISION NOT NULL,
    "medianLease" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceFairness" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "baselineScope" "public"."FairnessScope" NOT NULL,
    "tag" "public"."FairnessTag" NOT NULL,
    "rationale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceFairness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CacheStatus" (
    "id" TEXT NOT NULL,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,

    CONSTRAINT "CacheStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearch_shortUrl_key" ON "public"."SavedSearch"("shortUrl");

-- CreateIndex
CREATE UNIQUE INDEX "PriceFairness_transactionId_key" ON "public"."PriceFairness"("transactionId");

-- AddForeignKey
ALTER TABLE "public"."SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
