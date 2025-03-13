import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway'; // Importando o ChatGateway
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Importando PrismaModule para acesso ao banco
  controllers: [ChatController],
  providers: [ChatService, ChatGateway], // Adicionando ChatGateway
  exports: [ChatService],
})
export class ChatModule {}
