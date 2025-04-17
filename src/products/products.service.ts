import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {

    constructor(private prisma: PrismaService) { }

    async create(createProductDto: CreateProductDto) {

        try {
            const { ProductTag, ...product } = createProductDto;

            const category = await this.prisma.category.findUnique({ where: { id: product.categoryId } });

            if (!category) {
                throw new NotFoundException('Categoria no encontrada');
            }
            if (category.status === 'INACTIVE') {
                throw new NotFoundException('Categoria inactiva');
            }

            if(product.price <= 0) {
                throw new NotFoundException('El precio debe ser mayor a 0');
            }

            return await this.prisma.product.create({
                data: {
                    ...product,
                    ProductTag: {
                        create: ProductTag?.map((tagId) => ({ tag: { connect: { id: tagId } } })) || [],
                    },
                }
            });
        }
        catch (error) {
            throw error;
        }
    }

    async findAll() {
        return await this.prisma.product.findMany();
    }

    async findAllUser() {
        return await this.prisma.product.findMany({
            include: {
                category: true,
                ProductTag: {
                    select: {
                        tag: true,
                    },
                },
            },
        });
    }


    async findByNameOrId(query?: string) {
        if (!query) {
            return await this.prisma.product.findMany();
        }
        return await this.prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { id: query },
                ],
            },
        });
    }

    async findByNameOnly(query: string) {
        if (!query) {
            return await this.findAllUser();
        }
        return await this.prisma.product.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' },
            },
            include: {
                category: true,
                ProductTag: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
    }

    async update(id: string, updateProductDto: UpdateProductDto) {
        try {

            const {ProductTag, ...product } = updateProductDto;
            const category = await this.prisma.category.findUnique({ where: { id: product.categoryId } });
            const productFound = await this.prisma.product.findUnique({ where: { id } });

            if (!productFound) {
                throw new NotFoundException('Producto no encontrado');
            }

            if (!category) {
                throw new NotFoundException('Categoria no encontrada');
            }

            if (category.status === 'INACTIVE') {
                throw new NotFoundException('Categoria inactiva');
            }

            return await this.prisma.product.update({
                where: { id },
                data: {
                    ...product,
                    ProductTag: {
                        deleteMany: {}, 
                        create: ProductTag?.map((tagId) => ({ tag: { connect: { id: tagId } } })) || [],
                    },
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async remove(id: string) {
        try {
            const product = await this.prisma.product.findUnique({ where: { id } });

            if (!product) {
                throw new NotFoundException('Producto no encontrado');
            }

            return await this.prisma.product.update({
                where: { id },
                data: { status: 'INACTIVE' },
            })
        } catch (error) {
            throw error;
        }
    }

}