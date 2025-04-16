import { Injectable, Body, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {

    constructor(private prisma: PrismaService) { }

    async create(createProductDto: any) {
        return await this.prisma.product.create({ data: createProductDto });
    }

    async findAll() {
        return await this.prisma.product.findMany();
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
       if(!query) {
            return await this.prisma.product.findMany();
       }
         return await this.prisma.product.findMany({
                where: {
                 name: { contains: query, mode: 'insensitive' },
                },
          });
    }
        
    async update(id: string, updateProductDto: any) {
        try {
            const product = await this.prisma.product.findUnique({ where: { id } });

            if (!product) {
                throw new NotFoundException('Producto no encontrado');
            }
            return await this.prisma.product.update({
                where: { id },
                data: updateProductDto,
            });
        } catch (error) {
            throw error;
        }
    }

    async remove(id: string) {
        try{
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