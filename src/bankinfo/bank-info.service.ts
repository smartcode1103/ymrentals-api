import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankInfoDto } from './dto/create-bank-info.dto';

@Injectable()
export class BankInfoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBankInfoDto: CreateBankInfoDto) {
    return this.prisma.bankInfo.create({ data: createBankInfoDto });
  }

  async findAll() {
    return this.prisma.bankInfo.findMany();
  }

  async findByUserId(userId: string) {
    return this.prisma.bankInfo.findMany({ where: { userId } });
  }

  async findOne(id: string) {
    const bankInfo = await this.prisma.bankInfo.findUnique({ where: { id } });
    if (!bankInfo) throw new NotFoundException('Bank info not found');
    return bankInfo;
  }

  async remove(id: string) {
    const bankInfo = await this.findOne(id);
    return this.prisma.bankInfo.delete({ where: { id: bankInfo.id } });
  }
}
