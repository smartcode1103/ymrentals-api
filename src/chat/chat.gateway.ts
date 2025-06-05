import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { ChatService } from './chat.service';
  import { JwtService } from '@nestjs/jwt';
  import { Logger } from '@nestjs/common';
  
  @WebSocketGateway({
    cors: true,
    namespace: '/chat'
  })
  export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);
    private connectedUsers = new Map<string, string>(); // socketId -> userId

    constructor(
      private readonly chatService: ChatService,
      private readonly jwtService: JwtService
    ) {}

    async handleConnection(client: Socket) {
      try {
        // Extrair token da auth ou query string
        const token = client.handshake.auth?.token || client.handshake.query.token as string;
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

        // TODO: Implementar getUserConversations no ChatService
        // const conversations = await this.chatService.getUserConversations(userId);
        // conversations.forEach(conv => {
        //   client.join(`conversation_${conv.id}`);
        // });

        this.logger.log(`User ${userId} connected with socket ${client.id}`);

        // Notificar outros usuários que este usuário está online
        client.broadcast.emit('userOnline', { userId });

      } catch (error) {
        this.logger.error('Error during connection:', error);
        client.disconnect();
      }
    }

    async handleDisconnect(client: Socket) {
      const userId = this.connectedUsers.get(client.id);
      if (userId) {
        this.connectedUsers.delete(client.id);
        this.logger.log(`User ${userId} disconnected`);

        // Notificar outros usuários que este usuário está offline
        client.broadcast.emit('userOffline', { userId });
      }
    }

    // Evento para enviar mensagem
    @SubscribeMessage('send_message')
    async handleSendMessage(
      @MessageBody() data: { conversationId: string; content: string },
      @ConnectedSocket() client: Socket
    ) {
      try {
        const userId = this.connectedUsers.get(client.id);
        if (!userId) {
          return { error: 'User not authenticated' };
        }

        const message = await this.chatService.sendMessage(data.conversationId, userId, data.content);

        // Emitir a nova mensagem para todos os usuários na conversa
        this.server.to(`conversation_${data.conversationId}`).emit('new_message', {
          type: 'new_message',
          message
        });

        return { success: true, message };
      } catch (error) {
        this.logger.error('Error sending message:', error);
        return { error: 'Failed to send message' };
      }
    }

    // Evento para entrar em uma conversa
    @SubscribeMessage('join_conversation')
    async handleJoinConversation(
      @MessageBody() data: { conversationId: string },
      @ConnectedSocket() client: Socket
    ) {
      const userId = this.connectedUsers.get(client.id);
      if (!userId) {
        return { error: 'User not authenticated' };
      }

      client.join(`conversation_${data.conversationId}`);
      this.logger.log(`User ${userId} joined conversation ${data.conversationId}`);

      return { success: true };
    }

    // Evento para sair de uma conversa
    @SubscribeMessage('leave_conversation')
    async handleLeaveConversation(
      @MessageBody() data: { conversationId: string },
      @ConnectedSocket() client: Socket
    ) {
      client.leave(`conversation_${data.conversationId}`);
      return { success: true };
    }

    // Evento para marcar mensagens como lidas
    @SubscribeMessage('mark_read')
    async handleMarkRead(
      @MessageBody() data: { conversationId: string },
      @ConnectedSocket() client: Socket
    ) {
      try {
        const userId = this.connectedUsers.get(client.id);
        if (!userId) {
          return { error: 'User not authenticated' };
        }

        // TODO: Implementar markMessagesAsRead no ChatService
        // await this.chatService.markMessagesAsRead(data.conversationId, userId);

        // Notificar outros usuários na conversa que as mensagens foram lidas
        client.to(`conversation_${data.conversationId}`).emit('message_read', {
          type: 'message_read',
          conversationId: data.conversationId,
          userId
        });

        return { success: true };
      } catch (error) {
        this.logger.error('Error marking messages as read:', error);
        return { error: 'Failed to mark messages as read' };
      }
    }

    // Evento para indicar que o usuário está digitando
    @SubscribeMessage('typing')
    async handleTyping(
      @MessageBody() data: { conversationId: string; isTyping: boolean },
      @ConnectedSocket() client: Socket
    ) {
      const userId = this.connectedUsers.get(client.id);
      if (!userId) {
        return { error: 'User not authenticated' };
      }

      // Notificar outros usuários na conversa
      client.to(`conversation_${data.conversationId}`).emit('user_typing', {
        userId,
        isTyping: data.isTyping
      });

      return { success: true };
    }
  }
  