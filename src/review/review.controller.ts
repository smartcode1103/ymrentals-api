import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../user/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review' })
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.reviewService.create({ ...createReviewDto, userId: req.user.userId });
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  async findAll() {
    return this.reviewService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  async findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a review' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.reviewService.softDelete(id, req.user.userId);
  }
}
