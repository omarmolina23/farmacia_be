/*
  Warnings:

  - You are about to drop the column `totalValue` on the `Batch` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_supplierId_fkey";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "totalValue",
ADD COLUMN     "purchaseValue" DECIMAL(10,0) NOT NULL DEFAULT 0;
