import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: '123 Main St', description: 'Street name' })
  @IsString()
  street: string;

  @ApiProperty({ example: '42', description: 'House or apartment number' })
  @IsString()
  number: string;

  @ApiProperty({ example: 'Downtown', description: 'District name' })
  @IsString()
  district: string;

  @ApiProperty({ example: 'Lisbon', description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Lisbon', description: 'Province' })
  @IsString()
  province: string;

  @ApiProperty({ example: 38.7169, description: 'Latitude', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: -9.1399, description: 'Longitude', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 'uuid-user-id', description: 'User ID associated with the address' })
  @IsString()
  userId: string;
}
