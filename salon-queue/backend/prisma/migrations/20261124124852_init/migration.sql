-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('WAITING', 'CALLED', 'IN_CHAIR', 'DONE', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "BarberStatus" AS ENUM ('AVAILABLE', 'BUSY', 'ON_BREAK', 'OFF_DUTY');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('RECEPTION', 'BARBER', 'OWNER');

-- CreateTable
CREATE TABLE "QueueEntry" (
    "id" TEXT NOT NULL,
    "tokenNumber" SERIAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'WAITING',
    "barberPref" TEXT,
    "assignedBarber" TEXT,
    "calledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isWalkin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QueueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryService" (
    "id" SERIAL NOT NULL,
    "entryId" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameGu" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "EntryService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameGu" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "barberName" TEXT,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barber" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "BarberStatus" NOT NULL DEFAULT 'AVAILABLE',
    "onDuty" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Barber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "onlineQueueOpen" BOOLEAN NOT NULL DEFAULT true,
    "closingTime" TEXT NOT NULL DEFAULT '21:00',
    "openingTime" TEXT NOT NULL DEFAULT '09:00',

    CONSTRAINT "SalonSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QueueEntry_tokenNumber_key" ON "QueueEntry"("tokenNumber");

-- CreateIndex
CREATE INDEX "QueueEntry_status_idx" ON "QueueEntry"("status");

-- CreateIndex
CREATE INDEX "QueueEntry_phone_idx" ON "QueueEntry"("phone");

-- CreateIndex
CREATE INDEX "QueueEntry_status_joinedAt_idx" ON "QueueEntry"("status", "joinedAt");

-- CreateIndex
CREATE INDEX "EntryService_entryId_idx" ON "EntryService"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_username_key" ON "Staff"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Barber_name_key" ON "Barber"("name");

-- AddForeignKey
ALTER TABLE "EntryService" ADD CONSTRAINT "EntryService_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "QueueEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Partial unique indexes for active phones and active barber assignments
CREATE UNIQUE INDEX IF NOT EXISTS "uq_phone_active"
  ON "QueueEntry" ("phone")
  WHERE status IN ('WAITING', 'CALLED', 'IN_CHAIR');

CREATE UNIQUE INDEX IF NOT EXISTS "uq_barber_active"
  ON "QueueEntry" ("assignedBarber")
  WHERE status IN ('CALLED', 'IN_CHAIR');

