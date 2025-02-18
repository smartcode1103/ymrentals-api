import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateRentalDto {
  @ApiProperty({ example: '2024-03-01', description: 'Rental start date', type: String, format: 'date' })
@IsDateString()
startDate!: string;

  @ApiProperty({ example: '2024-03-05', description: 'Rental end date', type: 'string', format: 'date' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: 250.0, description: 'Total rental amount', type: Number })
@IsNumber()
totalAmount!: number;

  @ApiProperty({ example: 'uuid-equipment-id', description: 'Rented equipment ID' })
  @IsString()
  equipmentId!: string;

  @ApiProperty({ example: 'uuid-renter-id', description: 'Renter user ID' })
  @IsString()
  renterId!: string;

  @ApiProperty({ example: 'uuid-owner-id', description: 'Owner user ID' })
  @IsString()
  ownerId!: string;
}
