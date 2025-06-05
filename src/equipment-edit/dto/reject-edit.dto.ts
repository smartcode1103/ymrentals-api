import { IsNotEmpty, IsString } from 'class-validator';

export class RejectEditDto {
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}
