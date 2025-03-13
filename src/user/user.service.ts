import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserType } from '@prisma/client'; // Importando o enum do Prisma

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: { ...createUserDto, password: hashedPassword },
    });
  }

  async findAll(adminId: string) {
    await this.ensureAdmin(adminId);
  
    return this.prisma.user.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found or has been deleted');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: user.id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() }, // Soft delete
    });
  }

  async restore(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || !user.deletedAt) {
      throw new NotFoundException('User not found or is not deleted');
    }

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null }, // Restaura o usuário
    });
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    console.log('Usuário encontrado:', user);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials (User not found)');
    }
  
    console.log('Senha informada:', password);
    console.log('Senha armazenada:', user.password);
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('Senha válida?', isPasswordValid);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password');
    }
  
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
  
    console.log('Token de acesso:', token);
    
    return { accessToken: token };
  }
  

  async logout() {
    // Simulação de logout, idealmente gerenciamos uma blacklist de tokens
    return { message: 'User logged out successfully' };
  }

  async blockUser(adminId: string, userId: string) {
    await this.ensureAdmin(adminId); // Verifica se é ADMIN
    await this.findOne(userId);
  
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });
  }
  
  async unblockUser(adminId: string, userId: string) {
    await this.ensureAdmin(adminId);
    await this.findOne(userId);
  
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false },
    });
  }
  
  async getBlockedUsers(adminId: string) {
    await this.ensureAdmin(adminId);
  
    return this.prisma.user.findMany({
      where: { isBlocked: true },
    });
  }

  async reportUser(reportedUserId: string, reporterUserId: string, reportData: { reason: string; details: string; evidence: string[] }) {
    const reportedUser = await this.findOne(reportedUserId);
    
    if (!reportedUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verifica se todas as evidências são strings Base64 válidas
    if (!reportData.evidence || !Array.isArray(reportData.evidence) || reportData.evidence.some(evidence => typeof evidence !== 'string')) {
        throw new Error('Formato inválido para evidências. Deve ser um array de strings Base64.');
    }

    const report = await this.prisma.report.create({
      data: {
        reportedUserId,
        reporterUserId,
        reason: reportData.reason,
        details: reportData.details,
        evidence: reportData.evidence, // Salvar diretamente como array de Base64
        createdAt: new Date(),
      },
    });

    return {
      status: "success",
      message: "O relatório foi enviado com sucesso.",
      reportId: report.id,
      reportedUserId,
      timestamp: report.createdAt,
    };
}


  async changeUserRole(adminId: string, userId: string, newRole: string) {
    await this.ensureAdmin(adminId);
    await this.findOne(userId);
  
    const roleEnum = newRole.toUpperCase() as UserType;
    if (!Object.values(UserType).includes(roleEnum)) {
      throw new Error(`Invalid user role: ${newRole}`);
    }
  
    return this.prisma.user.update({
      where: { id: userId },
      data: { userType: roleEnum },
    });
  }

  async deletePermanently(adminId: string, userId: string) {
    await this.ensureAdmin(adminId);
    await this.findOne(userId);
  
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }
  async ensureAdmin(adminId: string) {
    const adminUser = await this.prisma.user.findUnique({ where: { id: adminId } });
  
    if (!adminUser || adminUser.userType !== UserType.ADMIN) {
      throw new UnauthorizedException('Apenas administradores podem executar esta ação.');
    }
  }
  
}
