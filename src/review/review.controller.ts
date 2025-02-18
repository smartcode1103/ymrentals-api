import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  async create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(createReviewDto);
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
  @ApiOperation({ summary: 'Soft delete a review' })
  async remove(@Param('id') id: string) {
    return this.reviewService.softDelete(id);
  }
}
