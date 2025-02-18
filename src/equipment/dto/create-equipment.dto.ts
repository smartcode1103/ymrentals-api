import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber, IsArray } from 'class-validator';

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

  @ApiProperty({ example: ['image1.jpg', 'image2.jpg'], description: 'Equipment images' })
  @IsArray()
  images: string[];

  @ApiProperty({ example: 'true', description: 'Availability status' })
  @IsBoolean()
  isAvailable: boolean;

  @ApiProperty({ example: 'uuid-owner-id', description: 'Owner user ID' })
  @IsString()
  ownerId: string;
}
