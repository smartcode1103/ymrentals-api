-- CreateEnum
CREATE TYPE "EquipmentEditStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "equipment_edits" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "category" TEXT,
    "categoryId" TEXT,
    "pricePeriod" "PricePeriod",
    "price" DOUBLE PRECISION,
    "salePrice" DOUBLE PRECISION,
    "images" TEXT[],
    "videos" TEXT[],
    "documents" TEXT[],
    "specifications" JSONB,
    "isAvailable" BOOLEAN,
    "addressId" TEXT,
    "status" "EquipmentEditStatus" NOT NULL DEFAULT 'PENDING',
    "moderatedAt" TIMESTAMP(3),
    "moderatedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_edits_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "equipment_edits" ADD CONSTRAINT "equipment_edits_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_edits" ADD CONSTRAINT "equipment_edits_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
