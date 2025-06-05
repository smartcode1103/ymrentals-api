/*
  Warnings:

  - The values [IN_PROGRESS] on the enum `RentalStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('REFERENCE', 'RECEIPT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentReceiptStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "RentalStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'ACTIVE', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Rental" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Rental" ALTER COLUMN "status" TYPE "RentalStatus_new" USING ("status"::text::"RentalStatus_new");
ALTER TYPE "RentalStatus" RENAME TO "RentalStatus_old";
ALTER TYPE "RentalStatus_new" RENAME TO "RentalStatus";
DROP TYPE "RentalStatus_old";
ALTER TABLE "Rental" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "dailyRate" DOUBLE PRECISION,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "maxRentalDays" INTEGER,
ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedBy" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'RECEIPT',
ADD COLUMN     "paymentReceipt" TEXT,
ADD COLUMN     "paymentReceiptStatus" "PaymentReceiptStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "pricePeriod" "PricePeriod",
ADD COLUMN     "returnNotificationSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "returnReminderDate" TIMESTAMP(3),
ADD COLUMN     "startTime" TEXT;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
