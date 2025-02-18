import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAddressDto: CreateAddressDto) {
    return this.prisma.address.create({ data: createAddressDto });
  }

  async findAll() {
    return this.prisma.address.findMany();
  }

  async findByUserId(userId: string) {
    return this.prisma.address.findMany({ where: { userId } });
  }

  async findOne(id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  async remove(id: string) {
    const address = await this.findOne(id);
    return this.prisma.address.delete({ where: { id: address.id } });
  }
}
