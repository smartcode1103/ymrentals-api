import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto & { userId: string }) {
    // Verificar se o usuário existe e é um locatário
    const user = await this.prisma.user.findUnique({
      where: { id: createReviewDto.userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.userType !== 'TENANT') {
      throw new ForbiddenException('Only tenants can create reviews. Landlords cannot review equipment.');
    }

    // Verificar se o equipamento existe
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: createReviewDto.equipmentId, deletedAt: null },
      include: { owner: true }
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    // Verificar se o usuário já fez uma review para este equipamento
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId: createReviewDto.userId,
        equipmentId: createReviewDto.equipmentId,
        deletedAt: null
      }
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this equipment');
    }

    // Verificar se o usuário já alugou este equipamento (opcional - para maior validação)
    const hasRented = await this.prisma.rental.findFirst({
      where: {
        renterId: createReviewDto.userId,
        equipmentId: createReviewDto.equipmentId,
        status: 'COMPLETED'
      }
    });

    if (!hasRented) {
      throw new BadRequestException('You can only review equipment you have rented');
    }

    return this.prisma.review.create({ data: createReviewDto });
  }

  async findAll() {
    return this.prisma.review.findMany({ where: { deletedAt: null } });
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id, deletedAt: null },
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async softDelete(id: string, userId: string) {
    const review = await this.findOne(id);

    // Verificar se o usuário é o dono da review ou um moderador/admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (review.userId !== userId && !['MODERATOR', 'MANAGER', 'ADMIN'].includes(user.role)) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    return this.prisma.review.update({
      where: { id: review.id },
      data: { deletedAt: new Date() },
    });
  }
}
