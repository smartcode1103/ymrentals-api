import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  UploadedFiles, 
  UseGuards, 
  Request,
  BadRequestException,
  Get,
  Param,
  Res
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../user/jwt-auth.guard';
import { UploadService } from './upload.service';
import { Response } from 'express';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload single image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    return this.uploadService.uploadFile(file, req.user.userId, 'image');
  }

  @Post('images')
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(@UploadedFiles() files: any[], @Request() req) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Verificar se todos são imagens
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Only image files are allowed');
      }
    }

    const uploadPromises = files.map(file => 
      this.uploadService.uploadFile(file, req.user.userId, 'image')
    );

    return Promise.all(uploadPromises);
  }

  @Post('document')
  @ApiOperation({ summary: 'Upload document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG are allowed');
    }

    return this.uploadService.uploadFile(file, req.user.userId, 'document');
  }

  @Post('video')
  @ApiOperation({ summary: 'Upload video' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException('Only video files are allowed');
    }

    // Limite de 100MB para vídeos
    if (file.size > 100 * 1024 * 1024) {
      throw new BadRequestException('Video file too large. Maximum size is 100MB');
    }

    return this.uploadService.uploadFile(file, req.user.userId, 'video');
  }

  @Get('file/:filename')
  @ApiOperation({ summary: 'Get uploaded file' })
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    return this.uploadService.getFile(filename, res);
  }

  @Post('profile-picture')
  @ApiOperation({ summary: 'Upload profile picture as base64' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    return this.uploadService.uploadProfilePicture(file, req.user.userId);
  }

  @Post('document-base64')
  @ApiOperation({ summary: 'Upload document as base64' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentAsBase64(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.uploadService.uploadDocumentAsBase64(file, req.user.userId);
  }

  @Post('image-base64')
  @ApiOperation({ summary: 'Upload image as base64' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImageAsBase64(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    return this.uploadService.uploadImageAsBase64(file, req.user.userId);
  }

  @Post('bi-document')
  @ApiOperation({ summary: 'Upload BI document as base64' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBiDocument(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and image files are allowed for BI documents');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new BadRequestException('File size must be less than 5MB');
    }

    return this.uploadService.uploadBiDocument(file, req.user.userId);
  }

  @Post('company-document-base64')
  @ApiOperation({ summary: 'Upload company document as base64' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCompanyDocumentBase64(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and image files are allowed for company documents');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new BadRequestException('File size must be less than 5MB');
    }

    return this.uploadService.uploadCompanyDocument(file, req.user.userId);
  }

  @Post('company-cover-image')
  @ApiOperation({ summary: 'Upload company cover image as base64' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCompanyCoverImage(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new BadRequestException('File size must be less than 5MB');
    }

    return this.uploadService.uploadCompanyCoverImage(file, req.user.userId);
  }

  @Post('company-document')
  @ApiOperation({ summary: 'Upload company document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCompanyDocument(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and image files are allowed');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new BadRequestException('File size must be less than 5MB');
    }

    return this.uploadService.uploadFile(file, 'anonymous', 'document');
  }
}
