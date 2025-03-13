import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common'; 
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
    return this.chatService.listChats(req.user.id);
  }

  @Post(':userId')
  @ApiOperation({ summary: 'Iniciar nova conversa' })
  async startChat(@Request() req, @Param('userId') userId: string) {
    return this.chatService.startChat(req.user.id, userId);
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Obter mensagens de uma conversa' })
  async getMessages(@Param('chatId') chatId: string) {
    return this.chatService.getMessages(chatId);
  }

  @Post(':chatId/message')
  @ApiOperation({ summary: 'Enviar mensagem' })
  async sendMessage(@Request() req, @Param('chatId') chatId: string, @Body() body: { content: string }) {
    return this.chatService.sendMessage(chatId, req.user.id, body.content);
  }

  @Delete(':chatId')
  @ApiOperation({ summary: 'Apagar conversa' })
  async deleteChat(@Request() req, @Param('chatId') chatId: string) {
    return this.chatService.deleteChat(chatId, req.user.id);
  }

  @Post('block')
  @ApiOperation({ summary: 'Bloquear usuário' })
  async blockUser(@Request() req, @Body() body: { userIdToBlock: string }) {
    return this.chatService.blockUser(req.user.id, body.userIdToBlock);
  }

  @Post('unblock')
  @ApiOperation({ summary: 'Desbloquear usuário' })
  async unblockUser(@Request() req, @Body() body: { userIdToUnblock: string }) {
    return this.chatService.unblockUser(req.user.id, body.userIdToUnblock);
  }
}
