import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

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
}
