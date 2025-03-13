import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async listChats(userId: string) {
    return this.prisma.chat.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
      include: { messages: true, initiator: true, receiver: true },
    });
  }

  async startChat(userId: string, participantId: string) {
    return this.prisma.chat.create({
      data: {
        initiatorId: userId,
        receiverId: participantId,
      },
    });
  }

  async getMessages(chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { messages: true },
    });

    if (!chat) {
      throw new NotFoundException('Chat não encontrado');
    }

    return chat.messages;
  }

  async sendMessage(chatId: string, senderId: string, content: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) {
      throw new NotFoundException('Chat não encontrado');
    }

    return this.prisma.message.create({
      data: {
        content,
        chatId,
        senderId,
      },
    });
  }

  async deleteChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) throw new NotFoundException('Chat não encontrado');

    if (chat.initiatorId !== userId && chat.receiverId !== userId) {
      throw new UnauthorizedException('Você não pode excluir este chat');
    }

    return this.prisma.chat.delete({ where: { id: chatId } });
  }

  async blockUser(blockerId: string, userIdToBlock: string) {
    const alreadyBlocked = await this.prisma.blockedUser.findFirst({
      where: { blockerId, blockedId: userIdToBlock },
    });

    if (alreadyBlocked) {
      throw new Error('Usuário já está bloqueado');
    }

    return this.prisma.blockedUser.create({
      data: {
        blockerId,
        blockedId: userIdToBlock,
      },
    });
  }

  async unblockUser(unblockerId: string, userIdToUnblock: string) {
    const blockedRecord = await this.prisma.blockedUser.findFirst({
      where: { blockerId: unblockerId, blockedId: userIdToUnblock },
    });

    if (!blockedRecord) {
      throw new NotFoundException('Usuário não está bloqueado');
    }

    return this.prisma.blockedUser.delete({
      where: { id: blockedRecord.id },
    });
  }
}
