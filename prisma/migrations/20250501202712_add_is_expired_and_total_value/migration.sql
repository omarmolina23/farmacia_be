-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isExpired" BOOLEAN NOT NULL DEFAULT false;
