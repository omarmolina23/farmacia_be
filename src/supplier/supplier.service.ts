import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateSupplierDto } from './dto/create.supplier';
import { UpdateSupplierDto } from './dto/update.supplier';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    try {
      return await this.prisma.proveedor.create({
        data: {
          ...createSupplierDto,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Supplier already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.proveedor.findMany();
  }

  async findOne(id: string) {
    const supplier = await this.prisma.proveedor.findUnique({
      where: {
        id: id,
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    const updateSupplier = await this.prisma.proveedor.update({
      where: {
        id: id,
      },
      data: {
        ...updateSupplierDto,
      },
    });

    if (!updateSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return updateSupplier;
  }

  async remove(id: string) {
    const deleteSupplier = await this.prisma.proveedor.delete({
      where: {
        id: id,
      },
    });
    if (!deleteSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return deleteSupplier;
  }
}
