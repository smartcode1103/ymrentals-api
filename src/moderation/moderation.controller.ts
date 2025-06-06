import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../user/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Moderation')
@Controller('moderation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('equipment/pending')
  @ApiOperation({ summary: 'Get pending equipment for moderation' })
  async getPendingEquipment(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Request() req?
  ) {
    return this.moderationService.getPendingEquipment(
      req.user.userId,
      page || 1,
      limit || 10,
      search
    );
  }

  @Get('equipment/:id')
  @ApiOperation({ summary: 'Get equipment details for moderation' })
  async getEquipmentForModeration(@Param('id') id: string, @Request() req) {
    return this.moderationService.getEquipmentForModeration(req.user.userId, id);
  }

  @Patch('equipment/:id/approve')
  @ApiOperation({ summary: 'Approve equipment' })
  async approveEquipment(@Param('id') id: string, @Request() req) {
    return this.moderationService.approveEquipment(req.user.userId, id);
  }

  @Patch('equipment/:id/reject')
  @ApiOperation({ summary: 'Reject equipment' })
  async rejectEquipment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req
  ) {
    return this.moderationService.rejectEquipment(req.user.userId, id, reason);
  }

  @Get('history')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get moderation history' })
  async getModerationHistory(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Request() req?
  ) {
    return this.moderationService.getModerationHistory(
      req.user.userId,
      page || 1,
      limit || 10,
      search,
      status
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get moderation statistics' })
  async getModerationStats(@Request() req) {
    return this.moderationService.getModerationStats(req.user.userId);
  }
}
