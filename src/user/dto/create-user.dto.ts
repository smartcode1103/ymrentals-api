import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsDate,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

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
}
