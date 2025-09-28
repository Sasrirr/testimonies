import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../registration/dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async createUser(dto: { email: string; password: string; fullName?: string; role?: string }) {
    console.log('UsersService.createUser DTO:', dto);
      console.log('UsersService.createUser received DTO:', dto);
      const user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName ?? '',
          email: dto.email,
          password: dto.password,
          role: (dto.role as UserRole) || UserRole.CONSUMER,
          status: 'ACTIVE',
        },
      });
      console.log('UsersService.createUser created user:', user);
      return user;
  }


  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
