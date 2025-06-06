import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserType, UserRole, AccountStatus } from '@prisma/client'; // Importando os enums do Prisma
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Definir status da conta baseado no tipo de usuário e se é empresa
    let accountStatus: any = 'APPROVED';

    // Landlords e empresas precisam de aprovação
    if (createUserDto.userType?.toUpperCase() === 'LANDLORD' || createUserDto.isCompany) {
      accountStatus = 'PENDING';
    }

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        userType: createUserDto.userType?.toUpperCase() as UserType || UserType.TENANT,
        accountStatus,
        // Garantir que campos de empresa sejam salvos corretamente
        companyName: createUserDto.isCompany ? createUserDto.companyName : null,
        companyAddress: createUserDto.isCompany ? createUserDto.companyAddress : null,
        companyType: createUserDto.isCompany ? createUserDto.companyType as any : null,
      },
    });

    // Enviar notificações baseadas no tipo de usuário
    if (user.userType === UserType.LANDLORD && user.accountStatus === AccountStatus.PENDING) {
      // Notificar Admin e Moderador Gerencial sobre novo landlord pendente
      await this.notificationsService.notifyLandlordPendingValidation(
        user.id,
        user.companyName || user.fullName
      );
    } else if (user.userType === UserType.TENANT) {
      // Notificar usuário sobre registro bem-sucedido
      await this.notificationsService.notifyUserRegistration(user.id);
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(adminId: string) {
    await this.ensureAdmin(adminId);
  
    return this.prisma.user.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        dateOfBirth: true,
        userType: true,
        isCompany: true,
        nif: true,
        profilePicture: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isBlocked: true,
        biDocument: true,
        biValidated: true,
        accountStatus: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Não incluir password
      },
    });

    if (!user) {
      throw new NotFoundException('User not found or has been deleted');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    // Se a senha foi fornecida, hash ela
    const updateData: any = { ...updateUserDto };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Converter dateOfBirth string para Date se fornecido
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    // Converter companyType para enum se fornecido
    if (updateData.companyType && typeof updateData.companyType === 'string') {
      // Validar se é um valor válido do enum CompanyType
      const validCompanyTypes = ['INDIVIDUAL', 'COMPANY', 'NGO'];
      if (validCompanyTypes.includes(updateData.companyType.toUpperCase())) {
        updateData.companyType = updateData.companyType.toUpperCase();
      } else {
        delete updateData.companyType; // Remove se não for válido
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Remover senha do retorno
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validar nova senha
    if (newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return { message: 'Password changed successfully' };
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
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        phoneNumber: true,
        userType: true,
        role: true,
        accountStatus: true,
        isBlocked: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
        isCompany: true,
        nif: true,
        companyName: true,
        companyAddress: true,
        companyType: true,
        companyDocuments: true,
        bio: true,
        occupation: true,
        location: true,
        profilePicture: true,
      }
    });

    console.log('Usuário encontrado:', user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials (User not found)');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked');
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

    // Remover senha do objeto de retorno
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken: token,
      user: userWithoutPassword
    };
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
        id: uuidv4(),
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
  // Métodos para gerenciar moderadores
  async createModerator(adminId: string, moderatorData: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    dateOfBirth: string;
    role: 'MODERATOR' | 'MODERATOR_MANAGER';
  }) {
    // Verificar permissões hierárquicas
    const adminUser = await this.prisma.user.findUnique({ where: { id: adminId } });

    if (!adminUser) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Apenas Admin pode criar Moderador Gerencial
    if (moderatorData.role === 'MODERATOR_MANAGER' && adminUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Apenas administradores podem criar moderadores gerenciais');
    }

    // Admin e Moderador Gerencial podem criar Moderador Básico
    if (moderatorData.role === 'MODERATOR' &&
        adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.MODERATOR_MANAGER) {
      throw new UnauthorizedException('Apenas administradores ou moderadores gerenciais podem criar moderadores básicos');
    }

    const hashedPassword = await bcrypt.hash(moderatorData.password, 10);

    const moderator = await this.prisma.user.create({
      data: {
        ...moderatorData,
        password: hashedPassword,
        dateOfBirth: new Date(moderatorData.dateOfBirth),
        userType: UserType.TENANT,
        role: moderatorData.role as UserRole,
        accountStatus: AccountStatus.APPROVED,
        createdBy: adminId,
      },
    });

    const { password, ...moderatorWithoutPassword } = moderator;
    return moderatorWithoutPassword;
  }

  async getModerators(adminId: string) {
    await this.ensureAdminOrManager(adminId);

    return this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.MODERATOR, UserRole.MODERATOR_MANAGER] },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        accountStatus: true,
        createdBy: true,
        createdAt: true,
      },
    });
  }



  async approveLandlord(adminId: string, landlordId: string) {
    await this.ensureAdmin(adminId);

    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId, userType: UserType.LANDLORD },
    });

    if (!landlord) {
      throw new NotFoundException('Locador não encontrado');
    }

    if (landlord.accountStatus !== AccountStatus.PENDING) {
      throw new ForbiddenException('Locador já foi processado');
    }

    return this.prisma.user.update({
      where: { id: landlordId },
      data: {
        accountStatus: AccountStatus.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
  }

  async rejectLandlord(adminId: string, landlordId: string, reason: string) {
    await this.ensureAdmin(adminId);

    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId, userType: UserType.LANDLORD },
    });

    if (!landlord) {
      throw new NotFoundException('Locador não encontrado');
    }

    if (landlord.accountStatus !== AccountStatus.PENDING) {
      throw new ForbiddenException('Locador já foi processado');
    }

    return this.prisma.user.update({
      where: { id: landlordId },
      data: {
        accountStatus: AccountStatus.REJECTED,
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  // Verificações de permissão
  async ensureAdmin(adminId: string) {
    const adminUser = await this.prisma.user.findUnique({ where: { id: adminId } });

    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Apenas administradores podem executar esta ação.');
    }
  }

  async ensureAdminOrManager(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR_MANAGER)) {
      throw new UnauthorizedException('Apenas administradores ou moderadores gerenciais podem executar esta ação.');
    }
  }

  async ensureModerator(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR_MANAGER && user.role !== UserRole.MODERATOR)) {
      throw new UnauthorizedException('Apenas moderadores podem executar esta ação.');
    }
  }

  // Métodos de verificação de email
  async sendEmailVerification(userId: string) {
    const user = await this.findOne(userId);

    if (user.isEmailVerified) {
      throw new ForbiddenException('Email já está verificado');
    }

    // Gerar token de verificação
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Salvar token no banco (você pode criar uma tabela separada para tokens)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
    });

    // Configurar transporter do nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'yuriafricano03@gmail.com',
        pass: process.env.GMAIL_PASS || 'your-app-password', // Use app password
      },
    });

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email/${verificationToken}`;

    const mailOptions = {
      from: process.env.GMAIL_USER || 'yuriafricano03@gmail.com',
      to: user.email,
      subject: 'Verificação de Email - YM Rentals',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3569b0;">Verificação de Email</h2>
          <p>Olá ${user.fullName},</p>
          <p>Clique no link abaixo para verificar seu email:</p>
          <a href="${verificationUrl}" style="background-color: #3569b0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verificar Email
          </a>
          <p>Este link expira em 24 horas.</p>
          <p>Se você não solicitou esta verificação, ignore este email.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { message: 'Email de verificação enviado com sucesso' };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw new Error('Erro ao enviar email de verificação');
    }
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Token inválido ou expirado');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { message: 'Email verificado com sucesso' };
  }

  // Métodos para validação de BI por moderadores
  async getPendingBiValidation(moderatorId: string) {
    await this.ensureModerator(moderatorId);

    return this.prisma.user.findMany({
      where: {
        biDocument: { not: null },
        biValidated: false,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        biDocument: true,
        createdAt: true,
      },
    });
  }

  async validateBi(moderatorId: string, userId: string, approved: boolean, reason?: string) {
    await this.ensureModerator(moderatorId);

    const user = await this.findOne(userId);

    if (!user.biDocument) {
      throw new NotFoundException('Usuário não possui documento de BI');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        biValidated: approved,
        biValidatedBy: moderatorId,
        biValidatedAt: new Date(),
        biRejectionReason: approved ? null : reason,
      },
    });
  }

  // Métodos específicos para validação de landlords
  async getPendingLandlords(validatorId: string) {
    // Apenas Admin e Moderador Gerencial podem validar landlords
    await this.ensureAdminOrManager(validatorId);

    return this.prisma.user.findMany({
      where: {
        userType: UserType.LANDLORD,
        accountStatus: AccountStatus.PENDING,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        companyName: true,
        companyType: true,
        companyAddress: true,
        nif: true,
        companyDocuments: true,
        createdAt: true,
      },
    });
  }

  async validateLandlord(validatorId: string, landlordId: string, approved: boolean, reason?: string) {
    // Apenas Admin e Moderador Gerencial podem validar landlords
    await this.ensureAdminOrManager(validatorId);

    const landlord = await this.findOne(landlordId);

    if (landlord.userType !== UserType.LANDLORD) {
      throw new BadRequestException('Usuário não é um locador');
    }

    if (landlord.accountStatus !== AccountStatus.PENDING) {
      throw new BadRequestException('Locador não está pendente de validação');
    }

    const updateData: any = {
      accountStatus: approved ? AccountStatus.APPROVED : AccountStatus.REJECTED,
    };

    if (approved) {
      updateData.approvedBy = validatorId;
      updateData.approvedAt = new Date();
    } else {
      updateData.rejectedBy = validatorId;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = reason;
    }

    const updatedLandlord = await this.prisma.user.update({
      where: { id: landlordId },
      data: updateData,
    });

    // Enviar notificação para o landlord sobre o resultado da validação
    if (approved) {
      await this.notificationsService.createNotification({
        userId: landlordId,
        title: 'Registro Aprovado!',
        message: 'Parabéns! Seu registro como locador foi aprovado. Agora você pode listar seus equipamentos.',
        type: 'SUCCESS',
        sendEmail: true,
        emailTemplate: 'landlord-approved',
      });
    } else {
      await this.notificationsService.createNotification({
        userId: landlordId,
        title: 'Registro Rejeitado',
        message: `Seu registro foi rejeitado. Motivo: ${reason || 'Não especificado'}. Entre em contato conosco para mais informações.`,
        type: 'ERROR',
        sendEmail: true,
        emailTemplate: 'landlord-rejected',
      });
    }

    return updatedLandlord;
  }

}
