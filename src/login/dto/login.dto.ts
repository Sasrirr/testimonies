import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsString()
    email: string;

    @ApiProperty({ example: 'yourPassword123', description: 'User password' })
    @IsString()
    password: string;
}
