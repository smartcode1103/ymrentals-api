import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';
import { PricePeriod } from './create-equipment.dto';

export class UpdateEquipmentDto {
  @ApiProperty({ example: 'DJI Mavic Pro', description: 'Equipment name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Professional drone for photography', description: 'Equipment description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Drones', description: 'Equipment category', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 50.0, description: 'Rental price', required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    example: 'DAILY',
    enum: PricePeriod,
    description: 'Rental price period',
    required: false,
  })
  @IsOptional()
  @IsEnum(PricePeriod)
  pricePeriod?: PricePeriod;

  @ApiProperty({ example: 1000.0, description: 'Sale price of the equipment', required: false })
  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @ApiProperty({
    example: ['base64image1...', 'base64image2...'],
    description: 'Base64-encoded images',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    example: ['base64video1...', 'base64video2...'],
    description: 'Base64-encoded videos',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @ApiProperty({ example: true, description: 'Availability status', required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({
    example: {
      Potência: '2000W',
      Cor: 'Vermelha',
      Peso: '15kg',
    },
    description: 'Dynamic equipment specifications (key-value pairs)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, string>;

  @ApiProperty({ example: 'uuid-address-id', description: 'Address ID', required: false })
  @IsOptional()
  @IsString()
  addressId?: string;

  @ApiProperty({
    example: ['data:application/pdf;base64,JVBERi0xLjcKJYGBgYEK...', 'data:image/png;base64,...'],
    description: 'Array of base64 encoded documents',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];
}
