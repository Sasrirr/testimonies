import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }

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
    // 1. Update Testimony Status
    const testimony = await this.prisma.testimony.findUnique({ where: { id: dto.testimonyId } });
    if (!testimony) throw new NotFoundException('Testimony not found');
    if (testimony.status !== 'PENDING') throw new BadRequestException('Only pending testimonies can be verified');

    let qrCodeUrl = null;
    if (dto.outcome === 'VERIFIED') {
      // Simulate QR code generation
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${testimony.embedId}`;
    }

    await this.prisma.testimony.update({
      where: { id: dto.testimonyId },
      data: {
        status: dto.outcome === 'VERIFIED' ? 'VERIFIED' : dto.outcome === 'REJECTED' ? 'REJECTED' : 'PENDING',
        qrCodeUrl,
      },
    });

    // 2. Create Verification Record
    await this.prisma.verification.create({
      data: {
        testimonyId: dto.testimonyId,
        verifiedById: dto.adminId,
        outcome: dto.outcome === 'VERIFIED' ? 'VERIFIED' : dto.outcome === 'REJECTED' ? 'REJECTED' : 'PENDING',
        notes: dto.notes || '',
        proofType: 'MANUAL',
        proofData: {},
        source: 'MANUAL',
      },
    });

    return { success: true, testimonyId: dto.testimonyId, outcome: dto.outcome };
  }
}
