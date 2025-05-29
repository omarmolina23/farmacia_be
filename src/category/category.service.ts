import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create.category';
import { UpdateCategoryDto } from './dto/update.category';

import { subDays, startOfWeek, format } from 'date-fns';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) { }

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          ...createCategoryDto,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe la categoria');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.category.findMany();
  }

  async findByName(query?: string) {
    const category = await this.prisma.category.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
    })

    return category;
  }

  async getSalesByCategoryWeekly() {
      try {
        // Obtener todas las ventas con sus productos y categorías dentro de un rango razonable (ejemplo últimos 3 meses)
        const salesWithProducts = await this.prisma.saleProductClient.findMany({
          select: {
            amount: true,
            venta: {
              select: {
                date: true,
              },
            },
            products: {
              select: {
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          where: {
            venta: {
              date: {
                gte: subDays(new Date(), 180), // últimos 180 días
              },
              repaid: false,
            },
          },
        });
  
        // Agrupar por semana y categoría
        const grouped: Record<string, Record<string, number>> = {}; // { "2025-01-11": { analgésicos: 146, ... } }
  
        for (const item of salesWithProducts) {
          // Fecha de la venta
          const saleDate = item.venta.date;
          // Obtener el inicio de la semana (lunes)
          const weekStart = startOfWeek(saleDate, { weekStartsOn: 1 }); // lunes como inicio de semana
          const weekKey = format(weekStart, 'yyyy-MM-dd');
  
          // Nombre categoría (ejemplo: "analgésicos")
          const categoryName = item.products.category.name;
  
          if (!grouped[weekKey]) grouped[weekKey] = {};
          if (!grouped[weekKey][categoryName]) grouped[weekKey][categoryName] = 0;
  
          grouped[weekKey][categoryName] += item.amount;
        }
  
        // Convertir el objeto agrupado a arreglo
        const result = Object.entries(grouped).map(([date, categories]) => ({
          date,
          ...categories,
        }));
  
        return result;
      } catch (error) {
        throw new BadRequestException(
          'Error al obtener las ventas por categoría semanal',
        );
      }
    }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const updateUser = await this.prisma.category.update({
      where: {
        id: id,
      },
      data: {
        ...updateCategoryDto,
      },
    });

    if (!updateUser) {
      throw new NotFoundException(`La categoría con ID ${id} no fue encontrada`);
    }

    return updateUser;
  }

  async remove(id: string) {
    try {
      const category = await this.prisma.category.findUnique({ where: { id } });

      if (!category) {
        throw new NotFoundException(`La categoría con ID ${id} no fue encontrada`);
      }

      return await this.prisma.category.update({
        where: { id },
        data: { status: 'INACTIVE' },
      })
    } catch (error) {
      throw error;
    }

  }
}
