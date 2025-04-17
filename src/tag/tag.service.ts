import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagService {

    constructor(private prisma: PrismaService) { }

    async create(createTagDto: CreateTagDto) {
        return await this.prisma.tag.create({ data: createTagDto });
    }

    async findAll() {
        return await this.prisma.tag.findMany();
    }

    async update(id: string, updateTagDto: UpdateTagDto) {
        try {
            const tag = await this.prisma.tag.findUnique({ where: { id } });
            if (!tag) {
                throw new Error('Etiqueta no encontrada');
            }
            return await this.prisma.tag.update({
                where: { id },
                data: updateTagDto,
            });
        } catch (error) {
            throw error;
        }

    }

    async remove(id: string) {
        return await this.prisma.tag.delete({
            where: { id },
        });
    }


}
