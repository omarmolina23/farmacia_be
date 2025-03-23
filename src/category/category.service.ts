import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create.category';
import { UpdateCategoryDto } from './dto/update.category';

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
