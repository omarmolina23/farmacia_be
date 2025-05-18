import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {

    constructor(private prisma: PrismaService) { }

    private validateId(id: string) {
        const isNumeric = /^\d+$/.test(id); // Solo números
        if (!isNumeric || id.length < 8) {
            throw new BadRequestException('La identificación debe contener solo números y tener al menos 8 dígitos');
        }
    }

    async create(createClientDto: CreateClientDto) {
        try {
            const { id } = createClientDto;

            const existingClient = await this.prisma.client.findUnique({ where: { id } });
            
            if (existingClient) {
                throw new BadRequestException('El cliente ya existe');
            }

            this.validateId(id);

            return await this.prisma.client.create({ data: createClientDto });
        }
        catch (error) {
            throw error;
        }
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

    async update(id: string, updateClientDto: UpdateClientDto) {
        try {
            const client = await this.prisma.client.findUnique({ where: { id } });
            if (!client) {
                throw new NotFoundException('Cliente no encontrado');
            }
            return await this.prisma.client.update({ where: { id }, data: updateClientDto });
        } catch (error) {
            throw error;
        }
    }
}