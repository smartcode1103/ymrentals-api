import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../user/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Listar conversas do usuário' })
  async listChats(@Request() req) {
    return this.chatService.listChats(req.user.userId);
  }

  @Post(':userId')
  @ApiOperation({ summary: 'Iniciar nova conversa' })
  async startChat(@Request() req, @Param('userId') userId: string) {
    return this.chatService.startChat(req.user.userId, userId);
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Obter mensagens de uma conversa' })
  async getMessages(@Param('chatId') chatId: string) {
    return this.chatService.getMessages(chatId);
  }

  @Post(':chatId/message')
  @ApiOperation({ summary: 'Enviar mensagem' })
  async sendMessage(@Request() req, @Param('chatId') chatId: string, @Body() body: { content: string }) {
    return this.chatService.sendMessage(chatId, req.user.userId, body.content);
  }

  @Patch(':chatId/read')
  @ApiOperation({ summary: 'Marcar mensagens como lidas' })
  async markMessagesAsRead(@Request() req, @Param('chatId') chatId: string) {
    return this.chatService.markMessagesAsRead(chatId, req.user.userId);
  }

  @Delete(':chatId')
  @ApiOperation({ summary: 'Apagar conversa' })
  async deleteChat(@Request() req, @Param('chatId') chatId: string) {
    return this.chatService.deleteChat(chatId, req.user.userId);
  }

  @Post('block')
  @ApiOperation({ summary: 'Bloquear usuário' })
  async blockUser(@Request() req, @Body() body: { userIdToBlock: string }) {
    return this.chatService.blockUser(req.user.userId, body.userIdToBlock);
  }

  @Post('unblock')
  @ApiOperation({ summary: 'Desbloquear usuário' })
  async unblockUser(@Request() req, @Body() body: { userIdToUnblock: string }) {
    return this.chatService.unblockUser(req.user.userId, body.userIdToUnblock);
  }
}
