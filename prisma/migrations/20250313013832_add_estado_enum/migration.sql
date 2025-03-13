/*
  Warnings:

  - The `estado` column on the `Categoria` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `estado` column on the `Lote` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `estado` column on the `Proveedor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `estado` column on the `Usuario` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVO', 'INACTIVO');

-- AlterTable
ALTER TABLE "Categoria" DROP COLUMN "estado",
ADD COLUMN     "estado" "Status" NOT NULL DEFAULT 'ACTIVO';

-- AlterTable
ALTER TABLE "Lote" DROP COLUMN "estado",
ADD COLUMN     "estado" "Status" NOT NULL DEFAULT 'ACTIVO';

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "estado" "Status" NOT NULL DEFAULT 'ACTIVO';

-- AlterTable
ALTER TABLE "Proveedor" DROP COLUMN "estado",
ADD COLUMN     "estado" "Status" NOT NULL DEFAULT 'ACTIVO';

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "estado",
ADD COLUMN     "estado" "Status" NOT NULL DEFAULT 'ACTIVO';
