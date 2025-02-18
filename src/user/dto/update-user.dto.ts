import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

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
}
