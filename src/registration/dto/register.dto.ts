import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsString()
    email: string;

    @ApiProperty({ example: 'yourPassword123', description: 'User password' })
    @IsString()
    password: string;

    @ApiProperty({ example: 'Jane Doe', description: 'Full name of the user', required: false, nullable: true })
    @IsOptional()
    @IsString()
    fullName?: string | null;

    @ApiProperty({ example: 'CONSUMER', description: 'User role (optional)', required: false, nullable: true })
    @IsOptional()
    @IsString()
    role?: string | null;

    @ApiProperty({ example: 'org-uuid', description: 'Organization ID (required for ADMIN role)', required: false })
    @IsOptional()
    @IsString()
    organizationId?: string;

    @ApiProperty({ example: 'ADMIN123', description: 'Admin request code (required for ADMIN role)', required: false })
    @IsOptional()
    @IsString()
    adminRequestCode?: string;
}
