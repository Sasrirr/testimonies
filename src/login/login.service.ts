import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    console.log('[LoginService] login user:', user);
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.password);
    console.log('[LoginService] bcrypt.compare:', { input: dto.password, hash: user.password, valid });
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    // Always use the secret configured in JwtModule
    const secret = this.jwtService['options']?.secret;
    console.log('[LoginService] signing with secret:', secret);
    const accessToken = this.jwtService.sign(payload, { secret });
    return {
      accessToken,
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
