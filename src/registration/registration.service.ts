import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class RegistrationService {
  constructor(private readonly usersService: UsersService) { }

  async register(dto: RegisterDto) {
    console.log('RegistrationService.register DTO:', dto);
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already registered');
    console.log('RegistrationService.register raw password:', dto.password);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    console.log('RegistrationService.register hashed password:', hashedPassword);
    return this.usersService.createUser({
      ...dto,
      password: hashedPassword,
    });
  }
}
