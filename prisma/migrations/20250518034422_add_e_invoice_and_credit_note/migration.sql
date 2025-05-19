/*
  Warnings:

  - You are about to drop the column `factus_number` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "factus_number",
ADD COLUMN     "number_credit_note" VARCHAR(50),
ADD COLUMN     "number_e_invoice" VARCHAR(50),
ALTER COLUMN "repaid" SET DEFAULT false;
