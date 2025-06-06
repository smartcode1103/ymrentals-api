import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentEditDto } from './dto/create-equipment-edit.dto';
import { ApproveEditDto } from './dto/approve-edit.dto';
import { RejectEditDto } from './dto/reject-edit.dto';

@Injectable()
export class EquipmentEditService {
  constructor(private prisma: PrismaService) {}

  async createEquipmentEdit(equipmentId: string, userId: string, createDto: CreateEquipmentEditDto) {
    // Verificar se o equipamento existe e pertence ao usuário
    const equipment = await this.prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        ownerId: userId,
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipamento não encontrado ou não pertence ao usuário');
    }

    // Verificar se já existe uma edição pendente
    const existingEdit = await this.prisma.equipmentEdit.findFirst({
      where: {
        equipmentId,
        status: 'PENDING',
      },
    });

    if (existingEdit) {
      throw new BadRequestException('Já existe uma edição pendente para este equipamento');
    }

    // Criar a solicitação de edição
    const equipmentEdit = await this.prisma.equipmentEdit.create({
      data: {
        equipmentId,
        ...createDto,
        images: createDto.images || [],
        videos: createDto.videos || [],
        documents: createDto.documents || [],
      },
      include: {
        equipment: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    return equipmentEdit;
  }

  async getPendingEdits(page: number = 1, limit: number = 10, status: string = 'PENDING') {
    const edits = await this.prisma.equipmentEdit.findMany({
      where: {
        status: status as any,
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            images: true,
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        moderator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.equipmentEdit.count({
      where: {
        status: status as any,
      },
    });

    return {
      edits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getEditById(editId: string, userId: string, userRole: string) {
    const edit = await this.prisma.equipmentEdit.findUnique({
      where: { id: editId },
      include: {
        equipment: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            Category: true,
            Address: true,
          },
        },
        moderator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!edit) {
      throw new NotFoundException('Edição não encontrada');
    }

    // Verificar permissões
    const isOwner = edit.equipment.ownerId === userId;
    const isModerator = ['MODERATOR', 'MANAGER', 'ADMIN'].includes(userRole);

    if (!isOwner && !isModerator) {
      throw new ForbiddenException('Acesso negado');
    }

    return edit;
  }

  async approveEdit(editId: string, userId: string, userRole: string) {
    if (!['MODERATOR', 'MANAGER', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Acesso negado');
    }

    const edit = await this.prisma.equipmentEdit.findUnique({
      where: { id: editId },
      include: {
        equipment: true,
      },
    });

    if (!edit) {
      throw new NotFoundException('Edição não encontrada');
    }

    if (edit.status !== 'PENDING') {
      throw new BadRequestException('Esta edição já foi processada');
    }

    // Iniciar transação para aplicar as alterações
    const result = await this.prisma.$transaction(async (tx) => {
      // Atualizar o status da edição
      const updatedEdit = await tx.equipmentEdit.update({
        where: { id: editId },
        data: {
          status: 'APPROVED',
          moderatedAt: new Date(),
          moderatedBy: userId,
        },
      });

      // Preparar dados para atualização do equipamento
      const updateData: any = {};
      
      if (edit.name !== null) updateData.name = edit.name;
      if (edit.description !== null) updateData.description = edit.description;
      if (edit.category !== null) updateData.category = edit.category;
      if (edit.categoryId !== null) updateData.categoryId = edit.categoryId;
      if (edit.pricePeriod !== null) updateData.pricePeriod = edit.pricePeriod;
      if (edit.price !== null) updateData.price = edit.price;
      if (edit.salePrice !== null) updateData.salePrice = edit.salePrice;
      if (edit.images.length > 0) updateData.images = edit.images;
      if (edit.videos.length > 0) updateData.videos = edit.videos;
      if (edit.documents.length > 0) updateData.documents = edit.documents;
      if (edit.specifications !== null) updateData.specifications = edit.specifications;
      if (edit.isAvailable !== null && edit.isAvailable !== undefined) updateData.isAvailable = edit.isAvailable;
      if (edit.addressId !== null) updateData.addressId = edit.addressId;

      // Aplicar as alterações ao equipamento
      const updatedEquipment = await tx.equipment.update({
        where: { id: edit.equipmentId },
        data: updateData,
      });

      return { updatedEdit, updatedEquipment };
    });

    return result;
  }

  async rejectEdit(editId: string, userId: string, userRole: string, rejectDto: RejectEditDto) {
    if (!['MODERATOR', 'MANAGER', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Acesso negado');
    }

    const edit = await this.prisma.equipmentEdit.findUnique({
      where: { id: editId },
    });

    if (!edit) {
      throw new NotFoundException('Edição não encontrada');
    }

    if (edit.status !== 'PENDING') {
      throw new BadRequestException('Esta edição já foi processada');
    }

    const updatedEdit = await this.prisma.equipmentEdit.update({
      where: { id: editId },
      data: {
        status: 'REJECTED',
        moderatedAt: new Date(),
        moderatedBy: userId,
        rejectionReason: rejectDto.rejectionReason,
      },
    });

    return updatedEdit;
  }

  async getUserEdits(userId: string, page: number = 1, limit: number = 10, status?: string) {
    const whereClause: any = {
      equipment: {
        ownerId: userId,
      },
    };

    if (status) {
      whereClause.status = status;
    }

    const edits = await this.prisma.equipmentEdit.findMany({
      where: whereClause,
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            category: true,
            images: true,
          },
        },
        moderator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.equipmentEdit.count({
      where: whereClause,
    });

    return {
      edits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
