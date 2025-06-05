import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEmail,
  IsDateString,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+244923456789', description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: '1990-05-20', description: 'Date of birth', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'New password', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: 'true', description: 'Email verification status', required: false })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiProperty({ example: 'true', description: 'Phone verification status', required: false })
  @IsOptional()
  @IsBoolean()
  isPhoneVerified?: boolean;

  @ApiProperty({
    example: 'data:image/jpeg;base64,...',
    description: 'Base64 encoded profile picture',
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({
    example: ['data:application/pdf;base64,...'],
    description: 'Array of base64 encoded company documents',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  companyDocuments?: string[];

  @ApiProperty({
    example: '123456789',
    description: 'NIF (tax ID)',
    required: false,
  })
  @IsOptional()
  @IsString()
  nif?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user is a company',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isCompany?: boolean;

  @ApiProperty({ example: 'Company Name Ltd', description: 'Company name', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: 'Rua da Empresa, 123', description: 'Company address', required: false })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiProperty({ example: 'LDA', description: 'Company type', required: false })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiProperty({ example: 'data:image/jpeg;base64,...', description: 'Company cover image', required: false })
  @IsOptional()
  @IsString()
  companyCoverImage?: string;

  @ApiProperty({ example: 'Software Engineer', description: 'User occupation', required: false })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiProperty({ example: 'Luanda, Angola', description: 'User location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'About me...', description: 'User biography', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'document.pdf', description: 'BI document URL', required: false })
  @IsOptional()
  @IsString()
  biDocument?: string;
}
