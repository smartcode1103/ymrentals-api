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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../user/jwt-auth.guard';
import { Roles } from '../user/roles.decorator';
import { RolesGuard } from '../user/roles.guard';
import { UploadService } from '../upload/upload.service';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly uploadService: UploadService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (Admin/Manager only)' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.categoryService.findAll(includeInactive === 'true');
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get category statistics (Admin/Manager only)' })
  getStats() {
    return this.categoryService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID with equipment' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin/Manager only)' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (Admin/Manager only)' })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  @Post(':id/upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload category image (Admin/Manager only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCategoryImage(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Limite de 5MB para imagens de categoria
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image file too large. Maximum size is 5MB');
    }

    // Upload da imagem
    const uploadResult = await this.uploadService.uploadFile(file, req.user.userId, 'image');

    // Atualizar categoria com a nova imagem
    return this.categoryService.updateImage(id, uploadResult.url);
  }
}
