/*
  Warnings:

  - The values [BUYER,REGISTERED,AGENT,ADMIN] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Aggregate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CacheStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceFairness` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SavedSearch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `renewSubscription` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('STANDARD', 'PREMIUM');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'STANDARD';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."SavedSearch" DROP CONSTRAINT "SavedSearch_userId_fkey";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "passwordHash",
ADD COLUMN     "renewSubscription" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'STANDARD';

-- DropTable
DROP TABLE "public"."Aggregate";

-- DropTable
DROP TABLE "public"."CacheStatus";

-- DropTable
DROP TABLE "public"."PriceFairness";

-- DropTable
DROP TABLE "public"."SavedSearch";

-- DropTable
DROP TABLE "public"."Transaction";

-- DropEnum
DROP TYPE "public"."FairnessScope";

-- DropEnum
DROP TYPE "public"."FairnessTag";
