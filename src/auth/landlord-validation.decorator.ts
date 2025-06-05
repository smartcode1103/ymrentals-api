import { SetMetadata } from '@nestjs/common';

export const LANDLORD_VALIDATION_KEY = 'landlord_validation';
export const RequireLandlordValidation = () => SetMetadata(LANDLORD_VALIDATION_KEY, true);
