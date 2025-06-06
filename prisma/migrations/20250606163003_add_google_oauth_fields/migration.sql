/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CompanyType" ADD VALUE 'LDA';
ALTER TYPE "CompanyType" ADD VALUE 'SA';
ALTER TYPE "CompanyType" ADD VALUE 'UNIPESSOAL';
ALTER TYPE "CompanyType" ADD VALUE 'COOPERATIVA';
ALTER TYPE "CompanyType" ADD VALUE 'OUTRO';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleEmail" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "googleProfilePicture" TEXT,
ADD COLUMN     "googleVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isGoogleUser" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "phoneNumber" DROP NOT NULL,
ALTER COLUMN "dateOfBirth" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "period" TEXT,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_equipmentId_key" ON "Cart"("userId", "equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
