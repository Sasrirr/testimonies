import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVerificationDto {
  @ApiProperty({
    description: 'UUID of the testimony to verify',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  testimonyId: string;

  @ApiProperty({
    description: 'UUID of the admin performing verification',
    example: 'bc4e72bc-52c6-4d42-9614-1c7f78ab6136'
  })
  @IsUUID()
  @IsNotEmpty()
  adminId: string;

  @ApiProperty({
    description: 'Verification outcome',
    enum: ['VERIFIED', 'REJECTED', 'PENDING'],
    example: 'VERIFIED'
  })
  @IsEnum(['VERIFIED', 'REJECTED', 'PENDING'])
  @IsNotEmpty()
  outcome: 'VERIFIED' | 'REJECTED' | 'PENDING';

  @ApiPropertyOptional({
    description: 'Source of verification',
    enum: ['MANUAL', 'AUTOMATED', 'SYSTEM'],
    example: 'MANUAL'
  })
  @IsOptional()
  @IsEnum(['MANUAL', 'AUTOMATED', 'SYSTEM'])
  source?: 'MANUAL' | 'AUTOMATED' | 'SYSTEM';

  @ApiPropertyOptional({
    description: 'Admin notes for verification decision',
    example: 'Verified through direct customer contact and reference checks'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Type of proof used for verification',
    example: 'MANUAL_REVIEW'
  })
  @IsOptional()
  @IsString()
  proofType?: string;

  @ApiPropertyOptional({
    description: 'Additional proof data (JSON)',
    example: { contactMethod: 'phone', contactDate: '2025-09-29' }
  })
  @IsOptional()
  proofData?: any;
}

export class VerificationResponseDto {
  @ApiProperty({ description: 'Verification ID' })
  verificationId: string;

  @ApiProperty({ description: 'Testimony ID' })
  testimonyId: string;

  @ApiProperty({ description: 'Verification outcome' })
  outcome: string;

  @ApiProperty({ description: 'Admin who verified' })
  verifiedBy: string;

  @ApiProperty({ description: 'Verification timestamp' })
  verifiedAt: Date;

  @ApiPropertyOptional({ description: 'Generated QR code URL' })
  qrCodeUrl?: string;
}

export class VerificationHistoryDto {
  @ApiPropertyOptional({ description: 'Filter by admin ID' })
  @IsOptional()
  @IsUUID()
  adminId?: string;

  @ApiPropertyOptional({
    description: 'Filter by outcome',
    enum: ['VERIFIED', 'REJECTED', 'PENDING']
  })
  @IsOptional()
  @IsEnum(['VERIFIED', 'REJECTED', 'PENDING'])
  outcome?: 'VERIFIED' | 'REJECTED' | 'PENDING';

  @ApiPropertyOptional({ description: 'Start date filter' })
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date filter' })
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsOptional()
  limit?: number;
}

export class BulkVerificationDto {
  @ApiProperty({
    description: 'Array of verification requests',
    type: [CreateVerificationDto]
  })
  verifications: CreateVerificationDto[];
}