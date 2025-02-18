import { Module } from '@nestjs/common';
import { BankInfoService } from './bank-info.service';
import { BankInfoController } from './bank-info.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BankInfoController],
  providers: [BankInfoService, PrismaService],
  exports: [BankInfoService],
})
export class BankInfoModule {}
