import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Rua da Independência', description: 'Street name', required: false })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ example: '123', description: 'House or apartment number', required: false })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiProperty({ example: 'Maianga', description: 'District/neighborhood name', required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'Luanda', description: 'City/Municipality name' })
  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Luanda', description: 'Province name' })
  @IsNotEmpty({ message: 'Província é obrigatória' })
  @IsString()
  province: string;

  @ApiProperty({
    example: -8.8390,
    description: 'Latitude coordinate (must be within Angola bounds)',
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'Latitude deve ser um número válido' })
  @Min(-18.5, { message: 'Latitude deve estar dentro dos limites de Angola' })
  @Max(-4.5, { message: 'Latitude deve estar dentro dos limites de Angola' })
  latitude?: number;

  @ApiProperty({
    example: 13.2894,
    description: 'Longitude coordinate (must be within Angola bounds)',
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'Longitude deve ser um número válido' })
  @Min(11.5, { message: 'Longitude deve estar dentro dos limites de Angola' })
  @Max(24.5, { message: 'Longitude deve estar dentro dos limites de Angola' })
  longitude?: number;
}
