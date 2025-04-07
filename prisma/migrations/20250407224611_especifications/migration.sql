-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "salePrice" DOUBLE PRECISION,
ADD COLUMN     "specifications" JSONB,
ADD COLUMN     "videos" TEXT[];
