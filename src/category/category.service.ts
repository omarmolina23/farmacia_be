import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCategoryDto } from './dto/create.category';
import { UpdateCategoryDto } from './dto/update.category';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.categoria.create({
        data: {
          ...createCategoryDto,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.categoria.findMany();
  }

  async findOne(id: string) {
    const category = await this.prisma.categoria.findUnique({
      where: {
        id: id,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const updateUser = await this.prisma.categoria.update({
      where: {
        id: id,
      },
      data: {
        ...updateCategoryDto,
      },
    });

    if (!updateUser) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return updateUser;
  }

  async remove(id: string) {
    const deleteCategory = await this.prisma.categoria.delete({
      where: {
        id: id,
      },
    });
    if (!deleteCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return deleteCategory;
  }
}
