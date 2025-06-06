import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {
    // Criar diretório de uploads se não existir
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }

    // Criar subdiretórios
    const subdirs = ['images', 'documents', 'videos', 'profiles'];
    subdirs.forEach(dir => {
      const dirPath = path.join(this.uploadPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  async uploadFile(file: any, userId: string, type: 'image' | 'document' | 'video') {
    try {
      // Gerar nome único para o arquivo
      const fileExtension = path.extname(file.originalname);
      const filename = `${uuidv4()}${fileExtension}`;
      const subdir = type === 'image' ? 'images' : type === 'document' ? 'documents' : 'videos';
      const filePath = path.join(this.uploadPath, subdir, filename);

      // Salvar arquivo no disco
      fs.writeFileSync(filePath, file.buffer);

      // Salvar informações no banco de dados
      const uploadRecord = await this.prisma.upload.create({
        data: {
          id: uuidv4(),
          filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: filePath,
          type,
          userId,
          url: `/upload/file/${filename}`,
          updatedAt: new Date(),
        }
      });

      return {
        id: uploadRecord.id,
        filename,
        originalName: file.originalname,
        url: uploadRecord.url,
        type,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload file');
    }
  }

  async uploadProfilePicture(file: any, userId: string) {
    try {
      // Converter arquivo para base64
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      // Atualizar o perfil do usuário diretamente com base64
      await this.prisma.user.update({
        where: { id: userId },
        data: { profilePicture: base64Data }
      });

      return {
        message: 'Profile picture updated successfully',
        profilePicture: base64Data
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload profile picture');
    }
  }

  async uploadDocumentAsBase64(file: any, userId: string) {
    try {
      // Converter arquivo para base64
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      return {
        message: 'Document uploaded successfully',
        document: base64Data,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload document');
    }
  }

  async uploadImageAsBase64(file: any, userId: string) {
    try {
      // Converter arquivo para base64
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      return {
        message: 'Image uploaded successfully',
        image: base64Data,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload image');
    }
  }

  async uploadBiDocument(file: any, userId: string) {
    try {
      // Converter arquivo para base64
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      // Atualizar o documento BI do usuário
      await this.prisma.user.update({
        where: { id: userId },
        data: { biDocument: base64Data }
      });

      return {
        message: 'BI document uploaded successfully',
        biDocument: base64Data
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload BI document');
    }
  }

  async uploadCompanyDocument(file: any, userId: string) {
    try {
      // Converter arquivo para base64
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      return {
        message: 'Company document uploaded successfully',
        document: base64Data,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload company document');
    }
  }

  async uploadCompanyCoverImage(file: any, userId: string) {
    try {
      // Converter arquivo para base64
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      // Atualizar a foto de capa da empresa
      await this.prisma.user.update({
        where: { id: userId },
        data: { companyCoverImage: base64Data }
      });

      return {
        message: 'Company cover image uploaded successfully',
        companyCoverImage: base64Data
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload company cover image');
    }
  }

  async getFile(filename: string, res: Response) {
    try {
      // Buscar arquivo no banco de dados
      const uploadRecord = await this.prisma.upload.findFirst({
        where: { filename }
      });

      if (!uploadRecord) {
        throw new NotFoundException('File not found');
      }

      // Verificar se arquivo existe no disco
      if (!fs.existsSync(uploadRecord.path)) {
        throw new NotFoundException('File not found on disk');
      }

      // Definir headers apropriados
      res.setHeader('Content-Type', uploadRecord.mimetype);
      res.setHeader('Content-Disposition', `inline; filename="${uploadRecord.originalName}"`);

      // Enviar arquivo
      const fileStream = fs.createReadStream(uploadRecord.path);
      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve file');
    }
  }

  async getUserFiles(userId: string, type?: string) {
    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    return this.prisma.upload.findMany({
      where,
      select: {
        id: true,
        filename: true,
        originalName: true,
        url: true,
        type: true,
        size: true,
        mimetype: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteFile(fileId: string, userId: string) {
    try {
      // Buscar arquivo
      const uploadRecord = await this.prisma.upload.findFirst({
        where: { id: fileId, userId }
      });

      if (!uploadRecord) {
        throw new NotFoundException('File not found');
      }

      // Deletar arquivo do disco
      if (fs.existsSync(uploadRecord.path)) {
        fs.unlinkSync(uploadRecord.path);
      }

      // Deletar registro do banco
      await this.prisma.upload.delete({
        where: { id: fileId }
      });

      return { message: 'File deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete file');
    }
  }

  // Converter arquivo para base64 (para compatibilidade com sistema atual)
  fileToBase64(file: any): string {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }

  // Converter base64 para arquivo (para compatibilidade com sistema atual)
  base64ToFile(base64String: string, originalName: string): any {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new BadRequestException('Invalid base64 string');
    }

    const mimetype = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    return {
      fieldname: 'file',
      originalname: originalName,
      encoding: '7bit',
      mimetype,
      buffer,
      size: buffer.length
    } as any;
  }
}
