import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: {
            Equipment: {
              where: {
                isAvailable: true,
                moderationStatus: 'APPROVED',
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        Equipment: {
          where: {
            isAvailable: true,
            moderationStatus: 'APPROVED',
            deletedAt: null,
          },
          include: {
            Address: true,
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          take: 20,
        },
        _count: {
          select: {
            Equipment: {
              where: {
                isAvailable: true,
                moderationStatus: 'APPROVED',
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { Equipment: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category._count.Equipment > 0) {
      // Se há equipamentos, apenas desativar
      return this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Se não há equipamentos, pode deletar
      return this.prisma.category.delete({
        where: { id },
      });
    }
  }

  async getStats() {
    const total = await this.prisma.category.count();
    const active = await this.prisma.category.count({
      where: { isActive: true },
    });
    const withEquipment = await this.prisma.category.count({
      where: {
        Equipment: {
          some: {
            isAvailable: true,
            moderationStatus: 'APPROVED',
            deletedAt: null,
          },
        },
      },
    });

    return {
      total,
      active,
      inactive: total - active,
      withEquipment,
      withoutEquipment: total - withEquipment,
    };
  }

  async updateImage(id: string, imageUrl: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return this.prisma.category.update({
      where: { id },
      data: { image: imageUrl },
    });
  }
}
