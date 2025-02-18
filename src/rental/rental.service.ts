import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';

@Injectable()
export class RentalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRentalDto: CreateRentalDto) {
    return this.prisma.rental.create({ data: createRentalDto });
  }

  async findAll() {
    return this.prisma.rental.findMany({ where: { deletedAt: null } });
  }

  async findOne(id: string) {
    const rental = await this.prisma.rental.findUnique({
      where: { id, deletedAt: null },
    });
    if (!rental) throw new NotFoundException('Rental not found');
    return rental;
  }

  async update(id: string, updateRentalDto: UpdateRentalDto) {
    const rental = await this.findOne(id);
    return this.prisma.rental.update({
      where: { id: rental.id },
      data: updateRentalDto,
    });
  }

  async softDelete(id: string) {
    const rental = await this.findOne(id);
    return this.prisma.rental.update({
      where: { id: rental.id },
      data: { deletedAt: new Date() },
    });
  }
}
