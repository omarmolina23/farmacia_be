/*
  Warnings:

  - You are about to drop the `Categoria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Medicamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Producto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Proveedor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Snack` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Venta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VentaProductoCliente` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[correo]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `esVerificado` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Lote" DROP CONSTRAINT "Lote_productoId_fkey";

-- DropForeignKey
ALTER TABLE "Lote" DROP CONSTRAINT "Lote_proveedorId_fkey";

-- DropForeignKey
ALTER TABLE "Medicamento" DROP CONSTRAINT "Medicamento_id_fkey";

-- DropForeignKey
ALTER TABLE "Producto" DROP CONSTRAINT "Producto_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "Snack" DROP CONSTRAINT "Snack_id_fkey";

-- DropForeignKey
ALTER TABLE "VentaProductoCliente" DROP CONSTRAINT "VentaProductoCliente_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "VentaProductoCliente" DROP CONSTRAINT "VentaProductoCliente_productoId_fkey";

-- DropForeignKey
ALTER TABLE "VentaProductoCliente" DROP CONSTRAINT "VentaProductoCliente_ventaId_fkey";

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "esVerificado" BOOLEAN NOT NULL;

-- DropTable
DROP TABLE "Categoria";

-- DropTable
DROP TABLE "Cliente";

-- DropTable
DROP TABLE "Lote";

-- DropTable
DROP TABLE "Medicamento";

-- DropTable
DROP TABLE "Producto";

-- DropTable
DROP TABLE "Proveedor";

-- DropTable
DROP TABLE "Snack";

-- DropTable
DROP TABLE "Venta";

-- DropTable
DROP TABLE "VentaProductoCliente";

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");
