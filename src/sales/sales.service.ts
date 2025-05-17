import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  private readonly saleInclude = {
    client: true,
    products: {
      include: {
        products: true,
        SaleBatch: true,
      },
    },
  };

  async findById(id: string) {
    await this.validateSale(id);

    return this.prisma.sale.findUnique({
      where: { id },
      include: this.saleInclude,
    });
  }

  async findByDateRange(startDate: Date, endDate: Date) {
    const adjustedEndDate = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    return this.prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: adjustedEndDate,
        },
        repaid: false,
      },
      include: this.saleInclude,
      orderBy: {
        date: 'asc',
      },
    });
  }

  async returnSale(id: string) {
    try {
      const sale = await this.findById(id);
      if (sale) {
        for (const product of sale.products) {
          for (const saleBatch of product.SaleBatch) {
            const batch = await this.prisma.batch.findUnique({
              where: { id: saleBatch.batchId },
            });

            if (!batch) {
              throw new NotFoundException(
                `Lote con ID ${saleBatch.batchId} no encontrado`,
              );
            }

            await this.prisma.batch.update({
              where: { id: saleBatch.batchId },
              data: {
                available_amount:
                  Number(batch.available_amount) + Number(saleBatch.quantity),
              },
            });
          }
        }

        const updateSale = await this.prisma.sale.update({
          where: { id },
          data: {
            repaid: true,
          },
          include: this.saleInclude,
        });

        return updateSale;
      }
    } catch (error) {
      throw error;
    }
  }

  private async validateSale(saleId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.repaid)
      throw new NotFoundException('Venta devolutiva ya realizada');
    return sale;
  }
}
