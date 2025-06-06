import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEquipmentDto: CreateEquipmentDto) {
    const {
      name,
      description,
      category,
      price,
      pricePeriod,
      salePrice,
      images,
      videos,
      isAvailable,
      ownerId,
      specifications,
      addressId,
    } = createEquipmentDto;

    // Verificar se o usuário é um locador aprovado
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (!owner) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o usuário é um locador (apenas locadores podem criar equipamentos)
    if (owner.userType !== 'LANDLORD') {
      throw new ForbiddenException('Apenas locadores podem criar equipamentos. Locatários não podem criar anúncios.');
    }

    if (owner.userType === 'LANDLORD' && owner.accountStatus !== 'APPROVED') {
      throw new ForbiddenException('Apenas locadores aprovados podem criar equipamentos');
    }

    return this.prisma.equipment.create({
      data: {
        name,
        description,
        category,
        price,
        pricePeriod,
        salePrice,
        images,
        videos,
        isAvailable: false, // Não disponível até aprovação
        ownerId,
        specifications,
        addressId,
        moderationStatus: 'PENDING', // Equipamento criado como pendente
      },
    });
  }
  

  async findAll(filters?: {
    category?: string;
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    page?: number;
    limit?: number;
    showAll?: boolean; // Para moderadores/admins verem todos
  }) {
    const where: any = {
      deletedAt: null,
      // Mostrar apenas equipamentos aprovados para usuários comuns
      moderationStatus: filters?.showAll ? undefined : 'APPROVED'
    };

    if (filters?.category) {
      // Verificar se é um UUID (categoryId) ou string (category name)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.category);

      if (isUUID) {
        where.categoryId = filters.category;
      } else {
        where.category = { contains: filters.category, mode: 'insensitive' };
      }
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    const skip = filters?.page && filters?.limit ? (filters.page - 1) * filters.limit : 0;
    const take = filters?.limit || undefined;

    const [equipment, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip,
        take,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              profilePicture: true,
              isEmailVerified: true,
              isPhoneVerified: true,
            },
          },
          Address: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.equipment.count({ where }),
    ]);

    return {
      data: equipment,
      total,
      page: filters?.page || 1,
      limit: filters?.limit || total,
      totalPages: filters?.limit ? Math.ceil(total / filters.limit) : 1,
    };
  }

  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            userType: true,
          },
        },
        Address: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');
    return equipment;
  }

  async update(id: string, updateEquipmentDto: UpdateEquipmentDto, userId: string) {
    const equipment = await this.findOne(id);

    // Verificar se o usuário é o dono do equipamento
    if (equipment.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own equipment');
    }

    return this.prisma.equipment.update({
      where: { id },
      data: updateEquipmentDto,
    });
  }

  async updateAvailability(id: string, isAvailable: boolean, userId: string) {
    const equipment = await this.findOne(id);

    // Verificar se o usuário é o dono do equipamento
    if (equipment.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own equipment');
    }

    return this.prisma.equipment.update({
      where: { id: equipment.id },
      data: { isAvailable },
    });
  }

  async findByOwner(ownerId: string) {
    return this.prisma.equipment.findMany({
      where: { ownerId, deletedAt: null },
      include: {
        Address: true,
        reviews: {
          select: {
            rating: true,
          },
        },
        rentals: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          where: {
            // Incluir apenas aluguéis ativos ou em processo
            status: {
              in: ['PENDING', 'APPROVED', 'PAID', 'ACTIVE']
            },
            // E que não expiraram
            endDate: {
              gte: new Date()
            }
          }
        },
        _count: {
          select: {
            rentals: true,
          },
        },
        edits: {
          where: {
            status: 'PENDING'
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCategories() {
    const categories = await this.prisma.equipment.findMany({
      where: { deletedAt: null },
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map(c => c.category).filter(Boolean);
  }

  async softDelete(id: string, userId: string) {
    const equipment = await this.findOne(id);

    // Verificar se o usuário é o dono do equipamento
    if (equipment.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own equipment');
    }

    return this.prisma.equipment.update({
      where: { id: equipment.id },
      data: { deletedAt: new Date() },
    });
  }
}
