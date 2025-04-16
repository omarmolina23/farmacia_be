/*
  Warnings:

  - Added the required column `documentType` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "documentType" AS ENUM ('Cédula de ciudadanía (CC)', 'Cédula de extranjería (CE)', '(NIT) Número de Identificación Tributaria');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "documentType" "documentType" NOT NULL;
