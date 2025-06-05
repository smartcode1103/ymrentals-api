import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsGateway } from './notifications.gateway';
import { v4 as uuidv4 } from 'uuid';

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  data?: any;
  sendEmail?: boolean;
  emailTemplate?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(notificationData: NotificationData) {
    const { userId, title, message, type, data, sendEmail = false, emailTemplate } = notificationData;

    // Criar notificação no banco
    const notification = await this.prisma.notifications.create({
      data: {
        id: uuidv4(),
        userId,
        title,
        message,
        type,
        data: data ? JSON.stringify(data) : null,
        updatedAt: new Date(),
      },
    });

    // Enviar notificação em tempo real via WebSocket
    this.notificationsGateway.sendNotificationToUser(userId, {
      id: notification.id,
      title,
      message,
      type,
      data,
      createdAt: notification.createdAt,
      isRead: false,
    });

    // Enviar email se solicitado
    if (sendEmail) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullName: true },
        });

        if (user?.email) {
          await this.emailService.sendNotificationEmail(
            user.email,
            user.fullName,
            title,
            message,
            emailTemplate,
          );
        }
      } catch (error) {
        console.error('Erro ao enviar email de notificação:', error);
      }
    }

    return notification;
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notifications.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notifications.count({
        where: { userId, deletedAt: null },
      }),
    ]);

    return {
      data: notifications.map(notification => ({
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notifications.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    return this.prisma.notifications.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notifications.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notifications.count({
      where: { userId, isRead: false, deletedAt: null },
    });
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notifications.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    return this.prisma.notifications.update({
      where: { id: notificationId },
      data: { deletedAt: new Date() },
    });
  }

  // Métodos específicos para diferentes tipos de notificação

  async notifyUserRegistration(userId: string) {
    return this.createNotification({
      userId,
      title: 'Bem-vindo ao YMRentals!',
      message: 'Sua conta foi criada com sucesso. Explore nossa plataforma e encontre os melhores equipamentos.',
      type: 'SUCCESS',
      sendEmail: true,
      emailTemplate: 'welcome',
    });
  }

  async notifyRentalCreated(userId: string, rentalId: string, equipmentName: string) {
    return this.createNotification({
      userId,
      title: 'Solicitação de Aluguel Criada',
      message: `Sua solicitação de aluguel para "${equipmentName}" foi criada e está sendo processada.`,
      type: 'INFO',
      data: { rentalId, equipmentName },
      sendEmail: true,
      emailTemplate: 'rental-created',
    });
  }

  async notifyRentalStatusChange(userId: string, rentalId: string, status: string, equipmentName: string) {
    const statusMessages = {
      APPROVED: 'aprovada',
      REJECTED: 'rejeitada',
      ACTIVE: 'ativada',
      COMPLETED: 'concluída',
      CANCELLED: 'cancelada',
    };

    return this.createNotification({
      userId,
      title: 'Status do Aluguel Atualizado',
      message: `Sua solicitação de aluguel para "${equipmentName}" foi ${statusMessages[status] || status.toLowerCase()}.`,
      type: status === 'APPROVED' || status === 'ACTIVE' ? 'SUCCESS' : status === 'REJECTED' ? 'WARNING' : 'INFO',
      data: { rentalId, status, equipmentName },
      sendEmail: true,
      emailTemplate: 'rental-status-change',
    });
  }

  async notifyEquipmentModerationResult(userId: string, equipmentId: string, equipmentName: string, status: string, reason?: string) {
    const isApproved = status === 'APPROVED';
    
    return this.createNotification({
      userId,
      title: `Equipamento ${isApproved ? 'Aprovado' : 'Rejeitado'}`,
      message: isApproved 
        ? `Seu equipamento "${equipmentName}" foi aprovado e está disponível para aluguel.`
        : `Seu equipamento "${equipmentName}" foi rejeitado. ${reason ? `Motivo: ${reason}` : ''}`,
      type: isApproved ? 'SUCCESS' : 'WARNING',
      data: { equipmentId, equipmentName, status, reason },
      sendEmail: true,
      emailTemplate: 'equipment-moderation',
    });
  }

  // Métodos hierárquicos de notificação

  async notifyLandlordPendingValidation(landlordId: string, landlordName: string) {
    // Notificar Admin e Moderador Gerencial
    const validators = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MODERATOR_MANAGER'] },
        accountStatus: 'APPROVED'
      },
      select: { id: true },
    });

    const notifications = validators.map(validator =>
      this.createNotification({
        userId: validator.id,
        title: 'Novo Locador Pendente',
        message: `O locador "${landlordName}" se registrou e aguarda validação.`,
        type: 'INFO',
        data: { type: 'pending_landlord', landlordId, landlordName },
        sendEmail: true,
        emailTemplate: 'landlord-pending-validation',
      })
    );

    return Promise.all(notifications);
  }

  async notifyEquipmentPendingModeration(equipmentId: string, equipmentName: string, ownerId: string) {
    // Notificar todos os moderadores (Básico, Gerencial e Admin)
    const moderators = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MODERATOR_MANAGER', 'MODERATOR'] },
        accountStatus: 'APPROVED'
      },
      select: { id: true },
    });

    const notifications = moderators.map(moderator =>
      this.createNotification({
        userId: moderator.id,
        title: 'Equipamento Pendente de Moderação',
        message: `O equipamento "${equipmentName}" foi submetido e aguarda aprovação.`,
        type: 'WARNING',
        data: { type: 'pending_equipment', equipmentId, equipmentName, ownerId },
        sendEmail: true,
        emailTemplate: 'equipment-pending-moderation',
      })
    );

    return Promise.all(notifications);
  }

  async notifyBeforeReturnDate(userId: string, equipmentName: string, returnDate: string) {
    return this.createNotification({
      userId,
      title: 'Lembrete de Devolução',
      message: `Lembre-se de devolver o equipamento "${equipmentName}" até ${returnDate}.`,
      type: 'WARNING',
      data: { type: 'return_reminder', equipmentName, returnDate },
      sendEmail: true,
      emailTemplate: 'return-reminder',
    });
  }

  async notifyAdminPendingApproval(type: 'user' | 'equipment', itemId: string, itemName: string) {
    // Buscar todos os admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    const notifications = admins.map(admin =>
      this.createNotification({
        userId: admin.id,
        title: `${type === 'user' ? 'Usuário' : 'Equipamento'} Pendente de Aprovação`,
        message: `${type === 'user' ? 'Um novo usuário' : 'Um novo equipamento'} "${itemName}" está aguardando aprovação.`,
        type: 'INFO',
        data: { type, itemId, itemName },
        sendEmail: true,
        emailTemplate: 'admin-pending-approval',
      })
    );

    return Promise.all(notifications);
  }

  async notifyModeratorPendingEquipment(equipmentId: string, equipmentName: string) {
    // Buscar todos os moderadores
    const moderators = await this.prisma.user.findMany({
      where: { role: { in: ['MODERATOR', 'MODERATOR_MANAGER'] } },
      select: { id: true },
    });

    const notifications = moderators.map(moderator => 
      this.createNotification({
        userId: moderator.id,
        title: 'Equipamento Pendente de Moderação',
        message: `O equipamento "${equipmentName}" está aguardando moderação.`,
        type: 'INFO',
        data: { equipmentId, equipmentName },
        sendEmail: true,
        emailTemplate: 'moderator-pending-equipment',
      })
    );

    return Promise.all(notifications);
  }
}
