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
  constructor(private prisma: PrismaService) { }

  async create(createSupplierDto: CreateSupplierDto) {
    try {
      return await this.prisma.supplier.create({
        data: {
          ...createSupplierDto,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('El proveedor ya existe');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.supplier.findMany();
  }

  async findByNameOrEmail(query?: string) {
    if (!query) {
      return await this.prisma.supplier.findMany();
    }

    return await this.prisma.supplier.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {

    try{
      const updateSupplier = await this.prisma.supplier.update({
        where: {
          id: id,
        },
        data: {
          ...updateSupplierDto,
        },
      });

      if (!updateSupplier) {
        throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
      }

      return updateSupplier;  
    }
    catch(error){
      if (error.code === 'P2002') {
        throw new ConflictException('El proveedor ya existe');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const supplier = await this.prisma.supplier.findUnique({ where: { id } });

      if (!supplier) {
        throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
      }

      return await this.prisma.supplier.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
    } catch (error) {
      throw error;
    }
  }
}
