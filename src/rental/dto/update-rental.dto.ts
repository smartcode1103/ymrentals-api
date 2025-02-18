import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RentalStatus } from '@prisma/client';

export class UpdateRentalDto {
  @ApiProperty({ example: 'APPROVED', description: 'New rental status', enum: RentalStatus })
  @IsEnum(RentalStatus)
  status: RentalStatus;
}
