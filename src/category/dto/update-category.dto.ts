import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiPropertyOptional({
    description: 'Category image (base64 encoded or URL)',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...'
  })
  @IsOptional()
  @IsString()
  image?: string;
}
