/*
  Warnings:

  - Added the required column `phone` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "phone" VARCHAR(20) NOT NULL;
