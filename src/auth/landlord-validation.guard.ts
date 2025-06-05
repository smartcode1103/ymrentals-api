import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { LANDLORD_VALIDATION_KEY } from './landlord-validation.decorator';

@Injectable()
export class LandlordValidationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresLandlordValidation = this.reflector.getAllAndOverride<boolean>(
      LANDLORD_VALIDATION_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiresLandlordValidation) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, accountStatus: true }
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.accountStatus !== 'APPROVED') {
      throw new ForbiddenException('Account not approved');
    }

    // Apenas Admin e Moderador Gerencial podem validar landlords
    const canValidateLandlords = user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR_MANAGER;

    if (!canValidateLandlords) {
      throw new ForbiddenException('Only Admin and Manager Moderators can validate landlords');
    }

    return true;
  }
}
