import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsDate,
  IsOptional,
  IsArray,
  IsBoolean,
  IsObject,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @ApiProperty({ example: 'Rua Amílcar Cabral', description: 'Street name', required: false })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ example: '123', description: 'House or apartment number', required: false })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiProperty({ example: 'Ingombota', description: 'District name', required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'Luanda', description: 'City name', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Luanda', description: 'Province name', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ example: 'Angola', description: 'Country name', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: -8.8390, description: 'Latitude', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 13.2894, description: 'Longitude', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 'Rua Amílcar Cabral, 123, Ingombota, Luanda, Luanda', description: 'Formatted address', required: false })
  @IsOptional()
  @IsString()
  formattedAddress?: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email', uniqueItems: true })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'User password' })
  @IsString()
  password: string;

  @ApiProperty({ example: '+351912345678', description: 'Phone number' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    example: '1990-05-20',
    description: 'Date of birth',
    type: 'string',
    format: 'date',
  })
  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty({ example: '123456789', description: 'NIF (tax ID)', required: false })
  @IsOptional()
  @IsString()
  nif?: string;

  @ApiProperty({
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...',
    description: 'Base64 encoded profile picture (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({
    example: ['data:application/pdf;base64,JVBERi0xLjcKJYGBgYEK...', 'data:image/png;base64,...'],
    description: 'Array of base64 encoded company documents (optional)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  companyDocuments?: string[];

  @ApiProperty({
    example: true,
    description: 'Indicates if the user is a company',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isCompany?: boolean;

  @ApiProperty({
    example: 'TENANT',
    description: 'User type: TENANT or LANDLORD',
  })
  @IsString()
  userType: string;

  @ApiProperty({
    example: 'Empresa ABC Lda',
    description: 'Company name (required if isCompany is true)',
    required: false,
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({
    example: 'Rua da Empresa, 123, Luanda',
    description: 'Company address',
    required: false,
  })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiProperty({
    example: 'LDA',
    description: 'Company type',
    enum: ['LDA', 'SA', 'UNIPESSOAL', 'COOPERATIVA', 'OUTRO'],
    required: false,
  })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiProperty({
    example: 'Software Engineer',
    description: 'User occupation',
    required: false,
  })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiProperty({
    example: 'Luanda, Angola',
    description: 'User location',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    example: 'About me...',
    description: 'User biography',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    example: 'document.pdf',
    description: 'BI document URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  biDocument?: string;

  @ApiProperty({
    example: 'data:image/jpeg;base64,...',
    description: 'Company cover image',
    required: false,
  })
  @IsOptional()
  @IsString()
  companyCoverImage?: string;

  @ApiProperty({
    description: 'User address information',
    required: false,
    type: AddressDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
