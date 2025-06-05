import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async create(createContentDto: CreateContentDto) {
    return this.prisma.content.create({
      data: createContentDto,
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.content.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { key: 'asc' },
    });
  }

  async findByKey(key: string) {
    const content = await this.prisma.content.findUnique({
      where: { key },
    });

    if (!content) {
      throw new NotFoundException(`Conteúdo com chave '${key}' não encontrado`);
    }

    return content;
  }

  async findOne(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('Conteúdo não encontrado');
    }

    return content;
  }

  async update(id: string, updateContentDto: UpdateContentDto) {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('Conteúdo não encontrado');
    }

    return this.prisma.content.update({
      where: { id },
      data: updateContentDto,
    });
  }

  async updateByKey(key: string, updateContentDto: UpdateContentDto) {
    const content = await this.prisma.content.findUnique({
      where: { key },
    });

    if (!content) {
      throw new NotFoundException(`Conteúdo com chave '${key}' não encontrado`);
    }

    return this.prisma.content.update({
      where: { key },
      data: updateContentDto,
    });
  }

  async remove(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('Conteúdo não encontrado');
    }

    return this.prisma.content.delete({
      where: { id },
    });
  }

  // Métodos específicos para páginas
  async getAboutContent() {
    try {
      return await this.findByKey('about');
    } catch {
      return {
        key: 'about',
        title: 'Sobre Nós',
        content: 'Conteúdo da página "Sobre" ainda não foi configurado.',
        isActive: true,
      };
    }
  }

  async getContactContent() {
    try {
      return await this.findByKey('contact');
    } catch {
      return {
        key: 'contact',
        title: 'Contato',
        content: 'Informações de contato ainda não foram configuradas.',
        isActive: true,
      };
    }
  }

  async getTermsContent() {
    try {
      return await this.findByKey('terms');
    } catch {
      return {
        key: 'terms',
        title: 'Termos de Uso',
        content: 'Termos de uso ainda não foram configurados.',
        isActive: true,
      };
    }
  }

  async getPrivacyContent() {
    try {
      return await this.findByKey('privacy');
    } catch {
      return {
        key: 'privacy',
        title: 'Política de Privacidade',
        content: 'Política de privacidade ainda não foi configurada.',
        isActive: true,
      };
    }
  }
}
