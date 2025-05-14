/*
  Warnings:

  - Added the required column `available_amount` to the `Batch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "available_amount" INTEGER NOT NULL;
