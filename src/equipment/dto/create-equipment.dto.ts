import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'DJI Mavic Pro', description: 'Equipment name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Professional drone for photography', description: 'Equipment description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Drones', description: 'Equipment category' })
  @IsString()
  category: string;

  @ApiProperty({ example: 50.0, description: 'Daily rental rate' })
  @IsNumber()
  dailyRate: number;

  @ApiProperty({ example: 1000.0, description: 'Sale price of the equipment', required: false })
  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @ApiProperty({
    example: ['base64image1...', 'base64image2...'],
    description: 'Base64-encoded images',
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    example: ['base64video1...', 'base64video2...'],
    description: 'Base64-encoded videos',
  })
  @IsArray()
  @IsString({ each: true })
  videos: string[];

  @ApiProperty({ example: true, description: 'Availability status' })
  @IsBoolean()
  isAvailable: boolean;

  @ApiProperty({ example: 'uuid-owner-id', description: 'Owner user ID' })
  @IsString()
  ownerId: string;

  @ApiProperty({
    example: {
      Potência: '2000W',
      Cor: 'Vermelha',
      Peso: '15kg',
    },
    description: 'Dynamic equipment specifications (key-value pairs)',
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, string>;
}
