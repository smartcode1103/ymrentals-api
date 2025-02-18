import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import {ReviewModule} from './review/review.module'
import {RentalModule} from './rental/rental.module'
import {EquipmentModule} from './equipment/equipment.module'
import {BankInfoModule} from './bankinfo/bank-info.module'
import {AddressModule} from './address/address.module'
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [UserModule, ReviewModule, RentalModule, EquipmentModule, 
    BankInfoModule, AddressModule, PrismaModule], // Importando UserModule e PrismaModule
})
export class AppModule {}
