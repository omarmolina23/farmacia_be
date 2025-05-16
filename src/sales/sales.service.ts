import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.sale.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            products: true,
            cliente: true,
          },
        },
      },
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
      },
      include: {
        products: {
          include: {
            products: true,
            cliente: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }
}
