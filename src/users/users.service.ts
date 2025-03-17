import { Injectable, Body, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {

  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
    return await this.prisma.user.create({ data: createUserDto });
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async findOneByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = this.prisma.user.findUnique({
        where: { id },
      });


      if(!user) {
        throw new NotFoundException('User not found');
      }

      return this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      throw error;
    }

  }

  async remove(id: string) {
    const user = this.prisma.user.findUnique({
      where: { id },
    });

    return this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    })

  }
}
