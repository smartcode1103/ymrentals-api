import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';

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
        isAvailable,
        ownerId,
        specifications,
        addressId,
      },
    });
  }
  

  async findAll() {
    return this.prisma.equipment.findMany({ where: { deletedAt: null } });
  }

  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id, deletedAt: null },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');
    return equipment;
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    const equipment = await this.findOne(id);
    return this.prisma.equipment.update({
      where: { id: equipment.id },
      data: { isAvailable },
    });
  }

  async softDelete(id: string) {
    const equipment = await this.findOne(id);
    return this.prisma.equipment.update({
      where: { id: equipment.id },
      data: { deletedAt: new Date() },
    });
  }
}
