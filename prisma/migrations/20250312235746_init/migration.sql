/*
  Warnings:

  - Added the required column `birthdate` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthdate" TIMESTAMP(3) NOT NULL;
