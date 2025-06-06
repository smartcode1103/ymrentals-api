import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentStatus, UserRole } from '@prisma/client';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  // Listar equipamentos pendentes de moderação
  async getPendingEquipment(moderatorId: string, page: number = 1, limit: number = 10, search?: string) {
    await this.ensureModerator(moderatorId);

    const skip = (page - 1) * limit;

    // Construir condições de busca
    const whereCondition: any = {
      moderationStatus: EquipmentStatus.PENDING,
      deletedAt: null,
    };

    // Adicionar pesquisa se fornecida
    if (search && search.trim()) {
      whereCondition.OR = [
        {
          name: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          category: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          owner: {
            fullName: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        },
        {
          owner: {
            email: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        },
        {
          owner: {
            companyName: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [equipment, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where: whereCondition,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              companyName: true,
              companyType: true,
            },
          },
          Address: {
            select: {
              street: true,
              city: true,
              province: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }, // Mais antigos primeiro
      }),
      this.prisma.equipment.count({
        where: whereCondition,
      }),
    ]);

    return {
      data: equipment,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Aprovar equipamento
  async approveEquipment(moderatorId: string, equipmentId: string) {
    await this.ensureModerator(moderatorId);

    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId, deletedAt: null },
    });

    if (!equipment) {
      throw new NotFoundException('Equipamento não encontrado');
    }

    if (equipment.moderationStatus !== EquipmentStatus.PENDING) {
      throw new ForbiddenException('Equipamento já foi moderado');
    }

    return this.prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        moderationStatus: EquipmentStatus.APPROVED,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        isAvailable: true, // Tornar disponível quando aprovado
      },
    });
  }

  // Rejeitar equipamento
  async rejectEquipment(moderatorId: string, equipmentId: string, reason: string) {
    await this.ensureModerator(moderatorId);

    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId, deletedAt: null },
    });

    if (!equipment) {
      throw new NotFoundException('Equipamento não encontrado');
    }

    if (equipment.moderationStatus !== EquipmentStatus.PENDING) {
      throw new ForbiddenException('Equipamento já foi moderado');
    }

    return this.prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        moderationStatus: EquipmentStatus.REJECTED,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        rejectionReason: reason,
        isAvailable: false, // Não disponível quando rejeitado
      },
    });
  }

  // Histórico de moderação
  async getModerationHistory(moderatorId: string, page: number = 1, limit: number = 10, search?: string, status?: string) {
    await this.ensureModerator(moderatorId);

    const skip = (page - 1) * limit;

    // Construir condições de busca
    const whereCondition: any = {
      moderatedBy: { not: null },
      deletedAt: null,
    };

    // Filtrar por status específico se fornecido
    if (status && (status === 'APPROVED' || status === 'REJECTED')) {
      whereCondition.moderationStatus = status;
    } else {
      // Se não especificado, buscar ambos
      whereCondition.moderationStatus = { in: [EquipmentStatus.APPROVED, EquipmentStatus.REJECTED] };
    }

    // Adicionar pesquisa se fornecida
    if (search && search.trim()) {
      whereCondition.OR = [
        {
          name: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          category: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          owner: {
            fullName: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        },
        {
          owner: {
            email: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        },
        {
          owner: {
            companyName: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        },
        {
          moderatedByUser: {
            fullName: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // Buscar todos os equipamentos moderados (não apenas do moderador atual)
    const [equipment, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where: whereCondition,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              companyName: true,
              companyType: true,
            },
          },
          moderatedByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          Address: {
            select: {
              street: true,
              city: true,
              province: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { moderatedAt: 'desc' },
      }),
      this.prisma.equipment.count({
        where: whereCondition,
      }),
    ]);

    return {
      data: equipment,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Estatísticas de moderação
  async getModerationStats(moderatorId: string) {
    await this.ensureModerator(moderatorId);

    const [pending, approved, rejected, myApproved, myRejected] = await Promise.all([
      this.prisma.equipment.count({
        where: {
          moderationStatus: EquipmentStatus.PENDING,
          deletedAt: null,
        },
      }),
      this.prisma.equipment.count({
        where: {
          moderationStatus: EquipmentStatus.APPROVED,
          deletedAt: null,
        },
      }),
      this.prisma.equipment.count({
        where: {
          moderationStatus: EquipmentStatus.REJECTED,
          deletedAt: null,
        },
      }),
      this.prisma.equipment.count({
        where: {
          moderationStatus: EquipmentStatus.APPROVED,
          moderatedBy: moderatorId,
          deletedAt: null,
        },
      }),
      this.prisma.equipment.count({
        where: {
          moderationStatus: EquipmentStatus.REJECTED,
          moderatedBy: moderatorId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      pending,
      approved,
      rejected,
      myApproved,
      myRejected,
      myTotal: myApproved + myRejected,
    };
  }

  // Buscar equipamento específico para moderação
  async getEquipmentForModeration(moderatorId: string, equipmentId: string) {
    await this.ensureModerator(moderatorId);

    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId, deletedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            companyName: true,
            companyType: true,
            companyDocument: true,
            companyAddress: true,
            accountStatus: true,
          },
        },
        Address: true,
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipamento não encontrado');
    }

    return equipment;
  }

  // Verificação de permissão
  private async ensureModerator(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR_MANAGER && user.role !== UserRole.MODERATOR)) {
      throw new ForbiddenException('Apenas moderadores podem executar esta ação.');
    }
  }
}
