import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create.category';
import { UpdateCategoryDto } from './dto/update.category';

import { subDays, subWeeks, startOfWeek, format } from 'date-fns';
import { getStartEndOfDayInColombia } from 'src/utils/date';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

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
    });

    return category;
  }

  async getSalesByCategoryWeekly() {
    try {
      const now = new Date();
      const colombiaNow = new Date(
        now.toLocaleString('en-US', { timeZone: 'America/Bogota' }),
      );
      const { start: todayStart } = getStartEndOfDayInColombia(colombiaNow);
      const sixMonthsAgo = startOfWeek(subWeeks(todayStart, 23), {
        weekStartsOn: 1,
      });
      // Obtener todas las ventas con sus productos y categorías dentro de un rango razonable (ejemplo últimos 3 meses)
      const salesWithCategories = await this.prisma.saleProductClient.findMany({
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
              gte: sixMonthsAgo, // últimos 6 meses
            },
            repaid: false,
          },
        },
      });

      // Obtener el conjunto de todas las categorías presentes
      const allCategories = new Set<string>();
      for (const sale of salesWithCategories) {
        allCategories.add(sale.products.category.name);
      }

      // Agrupar ventas por semana y categoría
      const grouped = new Map<string, Record<string, number>>();

      for (const sale of salesWithCategories) {
        const saleDate = new Date(sale.venta.date);
        const saleDateColombia = new Date(
          saleDate.toLocaleString('en-US', { timeZone: 'America/Bogota' }),
        );
        const weekStart = startOfWeek(saleDateColombia, { weekStartsOn: 1 });
        const weekKey = weekStart.toISOString().split('T')[0];
        const category = sale.products.category.name;

        if (!grouped.has(weekKey)) {
          grouped.set(weekKey, {});
        }

        const weekEntry = grouped.get(weekKey)!;
        weekEntry[category] = (weekEntry[category] || 0) + sale.amount;
      }

      // Construir resultado final asegurando todas las categorías
      const result: { week: string; [category: string]: number | string }[] =
        [];
      const currentWeekStart = startOfWeek(todayStart, { weekStartsOn: 1 });

      for (let i = 23; i >= 0; i--) {
        const weekDate = new Date(
          currentWeekStart.getTime() - i * 7 * 24 * 60 * 60 * 1000,
        );
        const weekKey = weekDate.toISOString().split('T')[0];

        const weekData: { week: string; [category: string]: number | string } =
          { week: weekKey };

        for (const category of allCategories) {
          weekData[category] = grouped.get(weekKey)?.[category] || 0;
        }

        result.push(weekData);
      }

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
      throw new NotFoundException(
        `La categoría con ID ${id} no fue encontrada`,
      );
    }

    return updateUser;
  }

  async remove(id: string) {
    try {
      const category = await this.prisma.category.findUnique({ where: { id } });

      if (!category) {
        throw new NotFoundException(
          `La categoría con ID ${id} no fue encontrada`,
        );
      }

      return await this.prisma.category.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
    } catch (error) {
      throw error;
    }
  }
}
