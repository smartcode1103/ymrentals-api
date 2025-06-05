import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: true,
  namespace: '/notifications'
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // socketId -> userId
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect();
        return;
      }

      // Verificar token JWT
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Armazenar conexão
      this.connectedUsers.set(client.id, userId);
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`User ${userId} connected with socket ${client.id}`);

      // Enviar confirmação de conexão
      client.emit('connected', { message: 'Conectado ao sistema de notificações' });

    } catch (error) {
      this.logger.error('Error during connection:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    
    if (userId) {
      this.connectedUsers.delete(client.id);
      
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      
      this.logger.log(`User ${userId} disconnected from socket ${client.id}`);
    }
  }

  // Enviar notificação para um usuário específico
  sendNotificationToUser(userId: string, notification: any) {
    const userSocketSet = this.userSockets.get(userId);
    
    if (userSocketSet && userSocketSet.size > 0) {
      userSocketSet.forEach(socketId => {
        this.server.to(socketId).emit('new_notification', notification);
      });
      
      this.logger.log(`Notification sent to user ${userId} on ${userSocketSet.size} socket(s)`);
    } else {
      this.logger.log(`User ${userId} not connected, notification will be stored for later`);
    }
  }

  // Enviar notificação para múltiplos usuários
  sendNotificationToUsers(userIds: string[], notification: any) {
    userIds.forEach(userId => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  // Enviar notificação broadcast para todos os usuários conectados
  sendBroadcastNotification(notification: any) {
    this.server.emit('broadcast_notification', notification);
    this.logger.log('Broadcast notification sent to all connected users');
  }

  @SubscribeMessage('mark_notification_read')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.connectedUsers.get(client.id);
    
    if (!userId) {
      return { error: 'User not authenticated' };
    }

    try {
      // Aqui você pode adicionar lógica para marcar como lida no banco
      // Por enquanto, apenas confirma a ação
      
      client.emit('notification_marked_read', { notificationId: data.notificationId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      return { error: 'Failed to mark notification as read' };
    }
  }

  @SubscribeMessage('get_unread_count')
  async handleGetUnreadCount(@ConnectedSocket() client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    
    if (!userId) {
      return { error: 'User not authenticated' };
    }

    try {
      // Aqui você pode buscar o count real do banco
      // Por enquanto, retorna um valor mock
      const unreadCount = 0; // Implementar busca real
      
      client.emit('unread_count', { count: unreadCount });
      return { success: true, count: unreadCount };
    } catch (error) {
      this.logger.error('Error getting unread count:', error);
      return { error: 'Failed to get unread count' };
    }
  }

  // Método para verificar se um usuário está online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  // Método para obter estatísticas de conexão
  getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      uniqueUsers: this.userSockets.size,
      userConnections: Array.from(this.userSockets.entries()).map(([userId, sockets]) => ({
        userId,
        socketCount: sockets.size
      }))
    };
  }
}
