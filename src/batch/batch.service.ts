import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Product, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BatchService {
  constructor(private prisma: PrismaService) {}

  async create(createBatchDto: CreateBatchDto) {
    try {
      const { productId, amount, number_batch, expirationDate } =
        createBatchDto;

      this.validateProduct(productId);
      this.validateExpirationDate(expirationDate);
      this.validateAmount(amount);

      const existingBatch = await this.prisma.batch.findFirst({
        where: { number_batch },
      });

      if (existingBatch) {
        throw new BadRequestException(
          `El número de lote "${number_batch}" ya existe.`,
        );
      }

      return await this.prisma.batch.create({
        data: {
          ...createBatchDto,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.batch.findMany({
      include: {
        product: true,
      },
    });
  }

  async findByNumberBatch(query: string) {
    if (!query) {
      return await this.prisma.batch.findMany({
        include: { product: true },
      });
    }
    return await this.prisma.batch.findMany({
      where: { number_batch: { contains: query, mode: 'insensitive' } },
      orderBy: [{ number_batch: 'asc' }],
      include: { product: true },
    });
  }

  async findById(query: string) {
    if (!query) {
      return await this.prisma.batch.findMany({
        include: { product: true },
      });
    }
    return await this.prisma.batch.findUnique({
      where: { id: query },
      include: { product: true },
    });
  }

  async findByProductId(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return await this.prisma.batch.findMany({
      where: { productId },
      orderBy: [{ number_batch: 'asc' }],
      include: { product: true },
    });
  }

  async update(id: string, updateBatchDto: UpdateBatchDto) {
    try {
      const { productId, amount, expirationDate } = updateBatchDto;
      const batch = await this.prisma.batch.findUnique({ where: { id } });

      if (!batch) {
        throw new NotFoundException('Lote no encontrado');
      }

      let product: Product | undefined;

      if (productId) {
        product = await this.validateProduct(productId);
      }

      if (expirationDate !== undefined) {
        this.validateExpirationDate(expirationDate);
      }

      if (amount !== undefined) {
        this.validateAmount(amount);
      }

      return await this.prisma.batch.update({
        where: { id },
        data: {
          ...updateBatchDto,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const batch = await this.prisma.batch.findUnique({ where: { id } });

      if (!batch) {
        throw new NotFoundException('Lote no encontrado');
      }

      return await this.prisma.batch.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
    } catch (error) {
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredBatches() {
    const now = new Date();
    const expiredBatches = await this.prisma.batch.findMany({
      where: {
        expirationDate: {
          lt: now,
        },
        isExpired: false,
      },
    });

    for (const batch of expiredBatches) {
      await this.prisma.batch.update({
        where: { id: batch.id },
        data: {
          isExpired: true,
          status: 'INACTIVE',
        },
      });
    }

    return `Se actualizaron ${expiredBatches.length} lotes expirados.`;
  }

  private async validateProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.status === 'INACTIVE')
      throw new NotFoundException('Producto inactivo');
    return product;
  }

  private validateExpirationDate(expirationDate: Date) {
    const now = new Date();
    if (!expirationDate || expirationDate <= now) {
      throw new NotFoundException(
        'La fecha de vencimiento debe ser en el futuro',
      );
    }
  }

  private validateAmount(amount: number) {
    if (amount <= 0) {
      throw new NotFoundException('La cantidad debe ser mayor a 0');
    }
  }
}
