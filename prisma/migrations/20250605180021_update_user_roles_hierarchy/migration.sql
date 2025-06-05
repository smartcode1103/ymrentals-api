/*
  Warnings:

  - The values [MANAGER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'MODERATOR', 'MODERATOR_MANAGER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "biDocument" TEXT,
ADD COLUMN     "biRejectionReason" TEXT,
ADD COLUMN     "biValidated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "biValidatedAt" TIMESTAMP(3),
ADD COLUMN     "biValidatedBy" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "companyCoverImage" TEXT,
ADD COLUMN     "emailVerificationExpires" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "occupation" TEXT;
