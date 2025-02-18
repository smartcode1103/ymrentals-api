import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5, description: 'Review rating (1-5)' })
  @IsNumber()
  rating: number;

  @ApiProperty({ example: 'Great equipment!', description: 'Optional comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ example: 'uuid-user-id', description: 'User ID who wrote the review' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'uuid-equipment-id', description: 'Reviewed equipment ID' })
  @IsString()
  equipmentId: string;
}
