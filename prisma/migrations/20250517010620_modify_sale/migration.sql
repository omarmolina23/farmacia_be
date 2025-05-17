/*
  Warnings:

  - You are about to drop the column `clientId` on the `SaleProductClient` table. All the data in the column will be lost.
  - Added the required column `clientId` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeName` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SaleProductClient" DROP CONSTRAINT "SaleProductClient_clientId_fkey";

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "bill_id" VARCHAR(50),
ADD COLUMN     "clientId" VARCHAR(50) NOT NULL,
ADD COLUMN     "cufe" VARCHAR(50),
ADD COLUMN     "employeeName" VARCHAR(50) NOT NULL,
ADD COLUMN     "factus_number" VARCHAR(50),
ADD COLUMN     "qr_image" VARCHAR(500),
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SaleProductClient" DROP COLUMN "clientId";

-- CreateTable
CREATE TABLE "SaleBatch" (
    "id" TEXT NOT NULL,
    "saleProductId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "SaleBatch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleBatch" ADD CONSTRAINT "SaleBatch_saleProductId_fkey" FOREIGN KEY ("saleProductId") REFERENCES "SaleProductClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleBatch" ADD CONSTRAINT "SaleBatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
