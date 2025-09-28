import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private verificationService: VerificationService,
  ) { }

  async getDashboardStats() {
    // Example: count testimonies, organizations, users
    const testimoniesCount = await this.prisma.testimony.count();
    const organizationsCount = await this.prisma.organization.count();
    const usersCount = await this.prisma.user.count();
    return { testimoniesCount, organizationsCount, usersCount };
  }

  async getPendingTestimonies() {
    // Fetch all testimonies with status PENDING
    return await this.prisma.testimony.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVerificationHistory() {
    // Fetch all verifications
    return await this.prisma.verification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async processVerification(dto: { testimonyId: string; outcome: string; adminId: string; notes?: string }) {
    // Use the dedicated VerificationService for all verification logic
    return await this.verificationService.createVerification({
      testimonyId: dto.testimonyId,
      adminId: dto.adminId,
      outcome: dto.outcome as 'VERIFIED' | 'REJECTED' | 'PENDING',
      notes: dto.notes,
      source: 'MANUAL',
      proofType: 'MANUAL_REVIEW',
    });
  }
}
