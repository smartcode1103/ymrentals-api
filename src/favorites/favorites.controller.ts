import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../user/jwt-auth.guard';

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user favorites' })
  async getUserFavorites(@Request() req) {
    return this.favoritesService.getUserFavorites(req.user.userId);
  }

  @Post(':equipmentId')
  @ApiOperation({ summary: 'Add equipment to favorites' })
  async addToFavorites(@Param('equipmentId') equipmentId: string, @Request() req) {
    return this.favoritesService.addToFavorites(req.user.userId, equipmentId);
  }

  @Delete(':equipmentId')
  @ApiOperation({ summary: 'Remove equipment from favorites' })
  async removeFromFavorites(@Param('equipmentId') equipmentId: string, @Request() req) {
    return this.favoritesService.removeFromFavorites(req.user.userId, equipmentId);
  }

  @Get('check/:equipmentId')
  @ApiOperation({ summary: 'Check if equipment is in favorites' })
  async isFavorite(@Param('equipmentId') equipmentId: string, @Request() req) {
    return this.favoritesService.isFavorite(req.user.userId, equipmentId);
  }

  @Post('toggle/:equipmentId')
  @ApiOperation({ summary: 'Toggle equipment in favorites' })
  async toggleFavorite(@Param('equipmentId') equipmentId: string, @Request() req) {
    return this.favoritesService.toggleFavorite(req.user.userId, equipmentId);
  }
}
