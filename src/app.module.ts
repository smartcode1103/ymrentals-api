import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import {ReviewModule} from './review/review.module'
import {RentalModule} from './rental/rental.module'
import {EquipmentModule} from './equipment/equipment.module'
import {AddressModule} from './address/address.module'
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { FavoritesModule } from './favorites/favorites.module';
import { UploadModule } from './upload/upload.module';
import { AdminModule } from './admin/admin.module';
import { ModerationModule } from './moderation/moderation.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';
import { CategoryModule } from './category/category.module';
import { ContentModule } from './content/content.module';
import { EquipmentEditModule } from './equipment-edit/equipment-edit.module';
import { StatsModule } from './stats/stats.module';
import { CartModule } from './cart/cart.module';


@Module({
  imports: [UserModule, ReviewModule, RentalModule, EquipmentModule, AddressModule, PrismaModule, ChatModule, FavoritesModule, CartModule, UploadModule, AdminModule, ModerationModule, NotificationsModule, EmailModule, CategoryModule, ContentModule, EquipmentEditModule, StatsModule], // Importando UserModule e PrismaModule
})
export class AppModule {}
