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
  import { PrismaService } from '../prisma/prisma.service';
  
  @WebSocketGateway({
    cors: true,
    namespace: '/chat'
  })
  export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);
    private connectedUsers = new Map<string, string>(); // socketId -> userId
    private recentMessages = new Map<string, number>(); // messageKey -> timestamp

    constructor(
      private readonly chatService: ChatService,
      private readonly jwtService: JwtService,
      private readonly prisma: PrismaService
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

        // Verificar se o usuário já tem conexões ativas e desconectar as antigas
        const existingConnections = Array.from(this.connectedUsers.entries())
          .filter(([socketId, connectedUserId]) => connectedUserId === userId);

        existingConnections.forEach(([socketId]) => {
          if (this.server && this.server.sockets && this.server.sockets.sockets) {
            const existingSocket = this.server.sockets.sockets.get(socketId);
            if (existingSocket && existingSocket.id !== client.id) {
              this.logger.log(`Disconnecting old socket ${socketId} for user ${userId}`);
              existingSocket.disconnect();
              this.connectedUsers.delete(socketId);
            }
          }
        });

        // Armazenar nova conexão
        this.connectedUsers.set(client.id, userId);

        // Juntar usuário às salas de suas conversas
        const conversations = await this.chatService.getUserConversations(userId);
        conversations.forEach(conv => {
          client.join(`conversation_${conv.id}`);
          this.logger.log(`User ${userId} joined conversation room: conversation_${conv.id}`);
        });

        this.logger.log(`✅ User ${userId} connected with socket ${client.id}. Total conversations: ${conversations.length}`);
        this.logger.log(`🔗 Total connected users: ${this.connectedUsers.size}`);

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

        // Verificar se a mensagem já foi processada recentemente (debounce)
        const messageKey = `${userId}_${data.conversationId}_${data.content}`;
        const now = Date.now();

        // Implementar debounce simples no backend também
        if (this.recentMessages.has(messageKey)) {
          const lastTime = this.recentMessages.get(messageKey);
          if (now - lastTime! < 1000) { // 1 segundo de debounce
            this.logger.warn(`Duplicate message blocked: ${messageKey}`);
            return { error: 'Message sent too quickly' };
          }
        }

        this.recentMessages.set(messageKey, now);

        // Limpar mensagens antigas do cache (após 5 segundos)
        setTimeout(() => {
          this.recentMessages.delete(messageKey);
        }, 5000);

        const message = await this.chatService.sendMessage(data.conversationId, userId, data.content);

        // Preparar dados da mensagem
        const roomName = `conversation_${data.conversationId}`;
        const messageData = {
          ...message,
          conversationId: data.conversationId
        };

        this.logger.log(`📤 Enviando mensagem para conversa ${data.conversationId}: ${message.content}`);

        // Buscar participantes da conversa
        const chat = await this.prisma.chat.findUnique({
          where: { id: data.conversationId },
          select: { initiatorId: true, receiverId: true }
        });

        if (!chat) {
          this.logger.error(`Chat ${data.conversationId} não encontrado`);
          return { error: 'Chat not found' };
        }

        const participantIds = [chat.initiatorId, chat.receiverId];
        let deliveredCount = 0;

        try {
          // Emitir para a sala específica
          this.server.to(roomName).emit('new_message', messageData);
          this.logger.log(`✅ Mensagem emitida para sala ${roomName}`);
        } catch (error) {
          this.logger.warn(`Erro ao emitir para sala ${roomName}:`, error);
        }

        // Garantir entrega direta para todos os participantes conectados
        participantIds.forEach(participantId => {
          const participantSockets = Array.from(this.connectedUsers.entries())
            .filter(([_, connectedUserId]) => connectedUserId === participantId)
            .map(([socketId]) => socketId);

          participantSockets.forEach(socketId => {
            try {
              const socket = this.server.sockets.sockets.get(socketId);
              if (socket) {
                if (participantId === userId) {
                  // Para o emissor: enviar como confirmação (não conta como nova)
                  socket.emit('message_sent_confirmation', messageData);
                  this.logger.log(`📤 Confirmação enviada para remetente ${socketId} (usuário ${participantId})`);
                } else {
                  // Para outros: enviar como nova mensagem
                  socket.emit('new_message', messageData);
                  this.logger.log(`✅ Nova mensagem entregue para socket ${socketId} (usuário ${participantId})`);
                }
                deliveredCount++;
              }
            } catch (error) {
              this.logger.warn(`Erro ao entregar mensagem para socket ${socketId}:`, error);
            }
          });
        });

        this.logger.log(`📊 Mensagem entregue para ${deliveredCount} sockets. Participantes: ${participantIds.join(', ')}`);

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

        await this.chatService.markMessagesAsRead(data.conversationId, userId);

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

    // Método auxiliar para garantir que todos os usuários de uma conversa estejam na sala
    private async ensureUsersInConversationRoom(conversationId: string) {
      try {
        // Buscar informações da conversa para obter os participantes
        const chat = await this.prisma.chat.findUnique({
          where: { id: conversationId },
          select: { initiatorId: true, receiverId: true }
        });

        if (!chat) {
          this.logger.warn(`Chat ${conversationId} not found`);
          return;
        }

        const participantIds = [chat.initiatorId, chat.receiverId];
        const roomName = `conversation_${conversationId}`;

        // Adicionar apenas os participantes da conversa à sala
        for (const [socketId, userId] of this.connectedUsers.entries()) {
          if (participantIds.includes(userId)) {
            try {
              const socket = this.server.sockets.sockets.get(socketId);
              if (socket && !socket.rooms.has(roomName)) {
                socket.join(roomName);
                this.logger.log(`✅ Added participant ${userId} to conversation room ${conversationId}`);
              }
            } catch (error) {
              this.logger.warn(`Erro ao adicionar usuário ${userId} à sala ${conversationId}:`, error);
            }
          }
        }
      } catch (error) {
        this.logger.error('Error ensuring users in conversation room:', error);
      }
    }
  }
