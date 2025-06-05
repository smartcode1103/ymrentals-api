import { Module } from '@nestjs/common';
import { EquipmentEditController } from './equipment-edit.controller';
import { EquipmentEditService } from './equipment-edit.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentEditController],
  providers: [EquipmentEditService],
  exports: [EquipmentEditService],
})
export class EquipmentEditModule {}
