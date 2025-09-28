import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already registered');
    const user = await this.usersService.createUser(dto);
    return this.generateToken(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.generateToken(user);
  }

  private generateToken(user: any): AuthResponseDto {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  // Always use the secret configured in JwtModule
  const secret = this.jwtService['options']?.secret;
  console.log('[AuthService] Signing JWT payload:', payload);
  console.log('[AuthService] Signing with secret:', secret);
  const accessToken = this.jwtService.sign(payload, { secret });
    return {
      accessToken,
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
