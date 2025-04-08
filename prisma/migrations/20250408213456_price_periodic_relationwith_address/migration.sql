/*
  Warnings:

  - You are about to drop the column `dailyRate` on the `Equipment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PricePeriod" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Equipment" DROP COLUMN "dailyRate",
ADD COLUMN     "addressId" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "pricePeriod" "PricePeriod";

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
