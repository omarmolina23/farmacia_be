import { Injectable, NotFoundException } from '@nestjs/common';
import { Product, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
@Injectable()
export class BatchService {
  constructor(private prisma: PrismaService) {}

  async create(createBatchDto: CreateBatchDto) {
    try {
      const { productId, supplierId, amount, expirationDate } = createBatchDto;

      const product = await this.validateProduct(productId);
      await this.validateSupplier(supplierId);
      this.validateExpirationDate(expirationDate);
      this.validateAmount(amount);

      const totalValue = createBatchDto.amount * Number(product.price);

      return await this.prisma.batch.create({
        data: {
          ...createBatchDto,
          totalValue: totalValue,
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
        supplier: true,
      },
    });
  }

  async findByNumberBatch(query: string) {
    if (!query) {
      return await this.prisma.batch.findMany({
        include: { product: true, supplier: true },
      });
    }
    return await this.prisma.batch.findMany({
      where: {
        number_batch: { contains: query, mode: 'insensitive' },
      },
    });
  }

  async findById(query: string) {
    if (!query) {
      return await this.prisma.batch.findMany({
        include: { product: true, supplier: true },
      });
    }
    return await this.prisma.batch.findUnique({
      where: {
        id: query,
      },
    });
  }

  async findByProductId(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
  
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
  
    return await this.prisma.batch.findMany({
      where: { productId },
      include: { product: true, supplier: true },
    });
  }

  async update(id: string, updateBatchDto: UpdateBatchDto) {
    try {
      const { productId, supplierId, amount, expirationDate } = updateBatchDto;
      const batch = await this.prisma.batch.findUnique({ where: { id } });

      if (!batch) {
        throw new NotFoundException('Lote no encontrado');
      }

      let totalValue = batch?.totalValue;
      let product: Product | undefined;

      if (productId) {
        product = await this.validateProduct(productId);
      }

      if (supplierId) {
        await this.validateSupplier(supplierId);
      }

      if (expirationDate !== undefined) {
        this.validateExpirationDate(expirationDate);
      }

      if (amount !== undefined) {
        this.validateAmount(amount);
        if (product) {
          totalValue = new Prisma.Decimal(amount).mul(new Prisma.Decimal(product.price));
        }
      }

      return await this.prisma.batch.update({
        where: { id },
        data: {
          ...updateBatchDto,
          totalValue: totalValue,
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

  private async validateProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.status === 'INACTIVE')
      throw new NotFoundException('Producto inactivo');
    return product;
  }

  private async validateSupplier(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    if (supplier.status === 'INACTIVE')
      throw new NotFoundException('Proveedor inactivo');
    return supplier;
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
