/*
  Warnings:

  - Added the required column `bill_id` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "bill_id",
ADD COLUMN     "bill_id" DECIMAL(10,0) NOT NULL;
