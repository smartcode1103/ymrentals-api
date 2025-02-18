import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBankInfoDto {
  @ApiProperty({ example: '1234567890', description: 'Bank account number' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 'Bank of Portugal', description: 'Bank name' })
  @IsString()
  bankName: string;

  @ApiProperty({ example: 'uuid-user-id', description: 'User ID associated with the bank info' })
  @IsString()
  userId: string;
}
