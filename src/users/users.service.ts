import { Injectable, Body } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {

  constructor(private prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
   return this.prisma.user.create({ data: createUserDto });
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findOneByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    const user = this.prisma.user.findUnique({
      where: { id },
    });

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
