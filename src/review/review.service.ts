import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto) {
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

  async softDelete(id: string) {
    const review = await this.findOne(id);
    return this.prisma.review.update({
      where: { id: review.id },
      data: { deletedAt: new Date() },
    });
  }
}
