-- AlterTable
ALTER TABLE "User" ALTER COLUMN "accountStatus" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'YM Rentals',
    "siteDescription" TEXT NOT NULL DEFAULT 'Plataforma de aluguel de equipamentos em Angola',
    "contactEmail" TEXT NOT NULL DEFAULT 'contato@ymrentals.com',
    "supportEmail" TEXT NOT NULL DEFAULT 'suporte@ymrentals.com',
    "maxFileSize" INTEGER NOT NULL DEFAULT 10,
    "allowedFileTypes" TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'pdf']::TEXT[],
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "registrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveEquipment" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveLandlords" BOOLEAN NOT NULL DEFAULT false,
    "maxEquipmentPerUser" INTEGER NOT NULL DEFAULT 50,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 24,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 6,
    "requireEmailVerification" BOOLEAN NOT NULL DEFAULT true,
    "requirePhoneVerification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
