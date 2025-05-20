import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import {ReviewModule} from './review/review.module'
import {RentalModule} from './rental/rental.module'
import {EquipmentModule} from './equipment/equipment.module'
import {AddressModule} from './address/address.module'
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';


@Module({
  imports: [UserModule, ReviewModule, RentalModule, EquipmentModule, AddressModule, PrismaModule, ChatModule], // Importando UserModule e PrismaModule
})
export class AppModule {}
