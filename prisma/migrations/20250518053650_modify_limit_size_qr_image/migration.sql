/*
  Warnings:

  - You are about to alter the column `qr_image` on the `Sale` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.

*/
-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "qr_image" SET DATA TYPE VARCHAR(200);
