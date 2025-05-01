import { Injectable, Body, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
@Injectable()
export class BatchService {

    constructor(private prisma: PrismaService) { }

    async create(createBatchDto: CreateBatchDto) {

        try {
            const { productId, supplierId, amount, expirationDate } = createBatchDto;

            const product = await this.prisma.product.findUnique({ where: { id: productId } });

            if (!product) {
                throw new NotFoundException('Producto no encontrado');
            }
            if (product.status === 'INACTIVE') {
                throw new NotFoundException('Producto inactivo');
            }
            const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });

            if (!supplier) {
                throw new NotFoundException('Proveedor no encontrado');
            }

            if (supplier.status === 'INACTIVE') {
                throw new NotFoundException('Proveedor inactivo');
            }

            const currentDate = new Date();

            if (!expirationDate || expirationDate <= currentDate) {
                throw new NotFoundException('La fecha de vencimiento debe ser en el futuro');
            }

            if(amount <= 0) {
                throw new NotFoundException('La cantidad debe ser mayor a 0');
            }

            const totalValue = createBatchDto.amount * Number(product.price);

            return await this.prisma.batch.create({ 
                data: {
                    ...createBatchDto,
                    totalValue: totalValue,
                }
            });

        } catch (error) {
            throw error;
        }
    }

    async findAll() {
        return await this.prisma.batch.findMany();
    }

    async findByNumberBatch(query: string) {
        if (!query) {
            return await this.prisma.batch.findMany();
        }
        return await this.prisma.batch.findMany({
            where: {
                number_batch: { contains: query, mode: 'insensitive' },
            },
        });
    }

    async findById(query: string) {
        if (!query) {
            return await this.prisma.batch.findMany();
        }
        return await this.prisma.batch.findUnique({
            where: {
                id: query,
            },
        });
    }

    

    async update(id: string, updateBatchDto: UpdateBatchDto) {
        try {

            const { productId, supplierId, amount, expirationDate } = updateBatchDto;
            const batch = await this.prisma.batch.findUnique({ where: { id } });
            let totalValue = batch?.totalValue;

            if (!batch) {
                throw new NotFoundException('Lote no encontrado');
            }

            const product = await this.prisma.product.findUnique({ where: { id: productId } });

            if (!product) {
                throw new NotFoundException('Producto no encontrado');
            }
            if (product.status === 'INACTIVE') {
                throw new NotFoundException('Producto inactivo');
            }
            const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });

            if (!supplier) {
                throw new NotFoundException('Proveedor no encontrado');
            }

            if (supplier.status === 'INACTIVE') {
                throw new NotFoundException('Proveedor inactivo');
            }

            const currentDate = new Date();

            if (expirationDate != undefined && expirationDate <= currentDate) {
                throw new NotFoundException('La fecha de vencimiento debe ser en el futuro');
            }

            if(amount != undefined && amount <= 0) {
                if(amount <= 0){
                    throw new NotFoundException('La cantidad debe ser mayor a 0');
                }
                
                totalValue = amount * Number(product.price);
            }

            return await this.prisma.batch.update({
                where: { id },
                data: {
                    ...updateBatchDto,
                    totalValue: totalValue,
                }
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
            })

        } catch (error) {
            throw error;
        }
    }

}