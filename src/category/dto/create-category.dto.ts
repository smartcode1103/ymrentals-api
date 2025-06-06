import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category icon (emoji or icon name)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Category image (base64 encoded or URL)',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...'
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Whether category is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
