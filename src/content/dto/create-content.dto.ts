import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContentDto {
  @ApiProperty({ description: 'Content key (unique identifier)' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Content title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Content body (supports HTML)' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Whether content is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
