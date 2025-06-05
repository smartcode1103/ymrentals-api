import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  // Hierarquia de roles: USER < MODERATOR < MODERATOR_MANAGER < ADMIN
  private roleHierarchy: Record<UserRole, number> = {
    USER: 1,
    MODERATOR: 2,
    MODERATOR_MANAGER: 3,
    ADMIN: 4,
  };

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, accountStatus: true, userType: true }
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.accountStatus !== 'APPROVED') {
      throw new ForbiddenException('Account not approved');
    }

    // Verificar se o usuário tem pelo menos um dos roles necessários
    // ou um role superior na hierarquia
    const userRoleLevel = this.roleHierarchy[user.role];
    const hasPermission = requiredRoles.some(requiredRole => {
      const requiredLevel = this.roleHierarchy[requiredRole];
      return userRoleLevel >= requiredLevel;
    });

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Adicionar informações do usuário ao request para uso posterior
    request.user.role = user.role;
    request.user.userType = user.userType;
    request.user.accountStatus = user.accountStatus;

    return true;
  }
}
