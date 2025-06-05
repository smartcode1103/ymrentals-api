import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../user/jwt-auth.guard';
import { Roles } from '../user/roles.decorator';
import { RolesGuard } from '../user/roles.guard';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new content (Admin/Manager only)' })
  create(@Body() createContentDto: CreateContentDto) {
    return this.contentService.create(createContentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all content (Admin/Manager only)' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.contentService.findAll(includeInactive === 'true');
  }

  // Endpoints públicos para páginas específicas
  @Get('about')
  @ApiOperation({ summary: 'Get about page content' })
  getAbout() {
    return this.contentService.getAboutContent();
  }

  @Get('contact')
  @ApiOperation({ summary: 'Get contact page content' })
  getContact() {
    return this.contentService.getContactContent();
  }

  @Get('terms')
  @ApiOperation({ summary: 'Get terms of service content' })
  getTerms() {
    return this.contentService.getTermsContent();
  }

  @Get('privacy')
  @ApiOperation({ summary: 'Get privacy policy content' })
  getPrivacy() {
    return this.contentService.getPrivacyContent();
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get content by key' })
  findByKey(@Param('key') key: string) {
    return this.contentService.findByKey(key);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get content by ID (Admin/Manager only)' })
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Patch('key/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update content by key (Admin/Manager only)' })
  updateByKey(@Param('key') key: string, @Body() updateContentDto: UpdateContentDto) {
    return this.contentService.updateByKey(key, updateContentDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update content by ID (Admin/Manager only)' })
  update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    return this.contentService.update(id, updateContentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete content (Admin/Manager only)' })
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }
}
