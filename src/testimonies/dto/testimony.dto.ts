import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestimonyStatus } from '@prisma/client';

export class CreateTestimonyDto {
  @ApiProperty({
    description: 'The UUID of the user/organization this testimony is about',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({
    description: 'The content of the testimony',
    example: 'Excellent service and professional staff. Highly recommend!'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description: 'Category of the testimony',
    example: 'SERVICE_QUALITY'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'URL to media file (image, video, etc.)',
    example: 'https://example.com/media/testimony-image.jpg'
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string;
}

export class UpdateTestimonyDto {
  @ApiPropertyOptional({
    description: 'Updated content of the testimony',
    example: 'Excellent service and professional staff. Highly recommend!'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Updated category of the testimony',
    example: 'SERVICE_QUALITY'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'Updated URL to media file',
    example: 'https://example.com/media/testimony-image.jpg'
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string;
}

export class TestimonyResponseDto {
  @ApiProperty({ description: 'Unique identifier of the testimony' })
  id: string;

  @ApiProperty({ description: 'Author information' })
  author: {
    id: string;
    fullName: string;
    profilePhotoUrl?: string;
  };

  @ApiProperty({ description: 'Subject information' })
  subject: {
    id: string;
    fullName: string;
    profilePhotoUrl?: string;
  };

  @ApiProperty({ description: 'Content of the testimony' })
  content: string;

  @ApiPropertyOptional({ description: 'Category of the testimony' })
  category?: string;

  @ApiPropertyOptional({ description: 'Media URL' })
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'AI-analyzed sentiment' })
  sentiment?: string;

  @ApiProperty({ description: 'Status of the testimony', enum: TestimonyStatus })
  status: TestimonyStatus;

  @ApiPropertyOptional({ description: 'QR code URL for verified testimonies' })
  qrCodeUrl?: string;

  @ApiProperty({ description: 'Unique embed ID for public access' })
  embedId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class EmbedTestimonyResponseDto {
  @ApiProperty({ description: 'Unique embed ID' })
  embedId: string;

  @ApiProperty({ description: 'Author name (anonymized if needed)' })
  authorName: string;

  @ApiPropertyOptional({ description: 'Author profile photo' })
  authorPhoto?: string;

  @ApiProperty({ description: 'Subject name' })
  subjectName: string;

  @ApiProperty({ description: 'Content of the testimony' })
  content: string;

  @ApiPropertyOptional({ description: 'Category' })
  category?: string;

  @ApiPropertyOptional({ description: 'Media URL' })
  mediaUrl?: string;

  @ApiProperty({ description: 'Verification status' })
  isVerified: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'QR code URL' })
  qrCodeUrl?: string;
}
