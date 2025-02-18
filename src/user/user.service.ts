import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null }, // Apenas usuários ativos
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found or has been deleted');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: user.id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() }, // Soft delete
    });
  }

  async restore(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || !user.deletedAt) {
      throw new NotFoundException('User not found or is not deleted');
    }

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null }, // Restaura o usuário
    });
  }
}
