/*
  Warnings:

  - You are about to drop the `Medicine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Snack` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number_batch` to the `Batch` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Medicine" DROP CONSTRAINT "Medicine_id_fkey";

-- DropForeignKey
ALTER TABLE "Snack" DROP CONSTRAINT "Snack_id_fkey";

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "number_batch" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "activeIngredient" VARCHAR(50),
ADD COLUMN     "concentration" VARCHAR(50),
ADD COLUMN     "description" VARCHAR(200),
ADD COLUMN     "volume" VARCHAR(50),
ADD COLUMN     "weight" VARCHAR(50),
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "Medicine";

-- DropTable
DROP TABLE "Snack";
