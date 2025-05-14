import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientService {

    constructor(private prisma: PrismaService) { }

    async create(createClientDto: CreateClientDto) {
        return await this.prisma.client.create({ data: createClientDto });
    }

    async findAll() {
        return await this.prisma.client.findMany();
    }

    async findOne(id: string) {
        try {
            const client = await this.prisma.client.findUnique({ where: { id } });
            if (!client) {
                throw new NotFoundException('Cliente no encontrado');
            }
            return client;
        } catch (error) {
            throw error;
        }
    }
}