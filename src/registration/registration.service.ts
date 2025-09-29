import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) { }

  async register(dto: RegisterDto) {
    console.log('RegistrationService.register DTO:', dto);

    // Check if email already exists
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already registered');

    // Admin-specific validation
    if (dto.role === 'ADMIN') {
      await this.validateAdminRegistration(dto);
    }

    // Hash password and create user
    console.log('RegistrationService.register raw password:', dto.password);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    console.log('RegistrationService.register hashed password:', hashedPassword);

    const user = await this.usersService.createUser({
      ...dto,
      password: hashedPassword,
    });

    // Create admin record if role is ADMIN
    if (dto.role === 'ADMIN') {
      await this.createAdminRecord(user.id, dto.organizationId);
    }

    return user;
  }

  private async validateAdminRegistration(dto: RegisterDto) {
    // 1. Require organizationId for admin registration
    if (!dto.organizationId) {
      throw new BadRequestException('Organization ID is required for admin registration');
    }

    // 2. Require admin request code
    if (!dto.adminRequestCode) {
      throw new BadRequestException('Admin request code is required for admin registration');
    }

    // 3. Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId }
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    // 4. Validate admin request code
    if ((organization as any).adminRequestCode !== dto.adminRequestCode) {
      throw new BadRequestException('Invalid admin request code');
    }

    // 5. Check admin limit (max 3 per organization)
    const adminCount = await this.prisma.admin.count({
      where: { organizationId: dto.organizationId } as any
    });

    if (adminCount >= 3) {
      throw new BadRequestException('Organization already has maximum number of admins (3)');
    }
  }

  private async createAdminRecord(userId: string, organizationId: string) {
    await this.prisma.admin.create({
      data: {
        userId: userId,
        organizationId: organizationId,
        permissions: { verify: true, manage: true },
      } as any,
    });
  }
}
