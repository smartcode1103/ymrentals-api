import { IsBoolean, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ModerateEquipmentEditDto {
  @ApiProperty({
    example: true,
    description: 'Whether to approve or reject the edit'
  })
  @IsBoolean()
  isApproved: boolean;

  @ApiProperty({
    example: 'Informações insuficientes sobre o equipamento',
    description: 'Reason for rejection (required when isApproved is false)',
    required: false
  })
  @ValidateIf(o => o.isApproved === false)
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
