import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Validate } from 'class-validator';
import { IsValidDateRange } from '../validators/date-range.validator';

export class CreateCartDto {
  @ApiProperty({ description: 'Equipment ID' })
  @IsString()
  equipmentId: string;

  @ApiProperty({ description: 'Quantity', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString()
  @Validate(IsValidDateRange, { message: 'Invalid date range' })
  startDate?: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString()
  @Validate(IsValidDateRange, { message: 'Invalid date range' })
  endDate?: string;

  @ApiProperty({ description: 'Period (HOURLY, DAILY, WEEKLY, MONTHLY)', required: false })
  @IsOptional()
  @IsString()
  period?: string;
}
