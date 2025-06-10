import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async listChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
      include: {
        Message: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            User: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true
              }
            }
          }
        },
        User_Chat_initiatorIdToUser: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true,
            email: true,
            phoneNumber: true,
            userType: true,
            isCompany: true,
            companyName: true,
            accountStatus: true,
            createdAt: true
          }
        },
        User_Chat_receiverIdToUser: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true,
            email: true,
            phoneNumber: true,
            userType: true,
            isCompany: true,
            companyName: true,
            accountStatus: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Para cada chat, calcular o número de mensagens não lidas
    const chatsWithUnreadCount = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await this.getUnreadCount(chat.id, userId);
        return {
          ...chat,
          unreadCount
        };
      })
    );

    return chatsWithUnreadCount;
  }

  async getUserConversations(userId: string) {
    return this.listChats(userId);
  }

  async startChat(userId: string, participantId: string) {
    // Verificar se já existe um chat entre esses usuários
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        OR: [
          { initiatorId: userId, receiverId: participantId },
          { initiatorId: participantId, receiverId: userId }
        ]
      }
    });

    if (existingChat) {
      return existingChat;
    }

    // Criar novo chat se não existir
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
      include: {
        Message: {
          include: {
            User: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
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

    // Verificar se o usuário tem permissão para enviar mensagem neste chat
    if (chat.initiatorId !== senderId && chat.receiverId !== senderId) {
      throw new UnauthorizedException('Você não tem permissão para enviar mensagens neste chat');
    }

    return this.prisma.message.create({
      data: {
        id: uuidv4(),
        content,
        chatId,
        senderId,
        isRead: false,
      },
      include: {
        User: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true
          }
        }
      }
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

  async markMessagesAsRead(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat) {
      throw new NotFoundException('Chat não encontrado');
    }

    // Verificar se o usuário tem permissão para marcar mensagens como lidas neste chat
    if (chat.initiatorId !== userId && chat.receiverId !== userId) {
      throw new UnauthorizedException('Você não tem permissão para acessar este chat');
    }

    // Marcar como lidas apenas as mensagens que não foram enviadas pelo próprio usuário
    return this.prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  }

  async getUnreadCount(chatId: string, userId: string) {
    return this.prisma.message.count({
      where: {
        chatId,
        senderId: { not: userId },
        isRead: false
      }
    });
  }
}
