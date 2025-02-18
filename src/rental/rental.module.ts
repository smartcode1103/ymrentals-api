import { Module } from '@nestjs/common';
import { RentalService } from './rental.service';
import { RentalController } from './rental.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RentalController],
  providers: [RentalService, PrismaService],
  exports: [RentalService],
})
export class RentalModule {}
