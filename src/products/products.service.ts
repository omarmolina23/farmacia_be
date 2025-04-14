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

}