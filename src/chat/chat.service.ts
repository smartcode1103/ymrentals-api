import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async listChats(userId: string) {
    return this.prisma.chat.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
      include: {
        Message: true,
        User_Chat_initiatorIdToUser: true,
        User_Chat_receiverIdToUser: true
      },
    });
  }

  async startChat(userId: string, participantId: string) {
    return this.prisma.chat.create({
      data: {
        id: uuidv4(),
        initiatorId: userId,
        receiverId: participantId,
      },
    });
  }

  async getMessages(chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { Message: true },
    });

    if (!chat) {
      throw new NotFoundException('Chat não encontrado');
    }

    return chat.Message;
  }

  async sendMessage(chatId: string, senderId: string, content: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) {
      throw new NotFoundException('Chat não encontrado');
    }

    return this.prisma.message.create({
      data: {
        id: uuidv4(),
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
        id: uuidv4(),
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
