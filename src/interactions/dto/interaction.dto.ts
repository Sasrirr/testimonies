import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InteractionType } from '@prisma/client';

export class CreateInteractionDto {
  @ApiProperty({
    description: 'Type of the target entity',
    enum: ['TESTIMONY', 'USER', 'ORGANIZATION'],
    example: 'TESTIMONY'
  })
  @IsString()
  @IsIn(['TESTIMONY', 'USER', 'ORGANIZATION'])
  targetType: 'TESTIMONY' | 'USER' | 'ORGANIZATION';

  @ApiProperty({
    description: 'UUID of the target entity',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: 'Type of interaction',
    enum: InteractionType,
    example: 'LIKE'
  })
  @IsEnum(InteractionType)
  interaction: InteractionType;

  @ApiPropertyOptional({
    description: 'Additional metadata for the interaction',
    example: { comment_text: 'Great point!', flag_reason: 'spam' }
  })
  @IsOptional()
  metadata?: any;
}

export class InteractionResponseDto {
  @ApiProperty({ description: 'Unique identifier of the interaction' })
  id: string;

  @ApiProperty({ description: 'User who created the interaction' })
  user: {
    id: string;
    fullName: string;
    profilePhotoUrl?: string;
  };

  @ApiProperty({ description: 'Type of target entity' })
  targetType: string;

  @ApiProperty({ description: 'Target entity ID' })
  targetId: string;

  @ApiProperty({ description: 'Type of interaction', enum: InteractionType })
  interaction: InteractionType;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: any;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}
