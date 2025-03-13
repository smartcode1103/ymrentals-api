import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { ChatService } from './chat.service';
  
  @WebSocketGateway({ cors: true }) // Permite conexões de diferentes origens
  export class ChatGateway {
    @WebSocketServer()
    server: Server;
  
    constructor(private readonly chatService: ChatService) {}
  
    // Evento para enviar mensagem e transmitir aos usuários conectados
    @SubscribeMessage('sendMessage')
    async handleSendMessage(
      @MessageBody() data: { chatId: string; senderId: string; content: string },
    ) {
      const message = await this.chatService.sendMessage(data.chatId, data.senderId, data.content);
      
      // Emitir a nova mensagem para todos os usuários no chat
      this.server.to(data.chatId).emit('newMessage', message);
      
      return message;
    }
  
    // Evento para entrar em uma sala específica de chat
    @SubscribeMessage('joinChat')
    async handleJoinChat(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
      client.join(chatId);
      return { message: `Entrou na sala ${chatId}` };
    }
  
    // Evento para sair de um chat
    @SubscribeMessage('leaveChat')
    async handleLeaveChat(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
      client.leave(chatId);
      return { message: `Saiu da sala ${chatId}` };
    }
  }
  