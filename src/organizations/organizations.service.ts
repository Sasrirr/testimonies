import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async getOrganizationProfile(orgId: string) {
    // Fetch organization profile by orgId
    return await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        employees: true,
      },
    });
  }

  async getOrganizationTestimonies(orgId: string) {
    // Fetch all testimonies about the organization
    return await this.prisma.testimony.findMany({
      where: { subjectId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVerifiedOrganizationTestimonies(orgId: string) {
    // Fetch verified testimonies with embed codes
    return await this.prisma.testimony.findMany({
      where: { subjectId: orgId, status: 'VERIFIED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        embedId: true,
        qrCodeUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
