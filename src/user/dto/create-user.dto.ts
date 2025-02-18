import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsDate, IsOptional } from 'class-validator';

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

  @ApiProperty({ example: '1990-05-20', description: 'Date of birth', type: 'string', format: 'date' })
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty({ example: '123456789', description: 'NIF (tax ID)', required: false })
  @IsOptional()
  @IsString()
  nif?: string;
}
