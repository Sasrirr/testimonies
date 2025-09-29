import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) { }

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

  async createOrganization(dto: any) {
    // dto: { orgName, userId, sector?, licenseId?, contactInfo? }

    // Generate simple admin request code (6 chars for easy testing)
    const adminRequestCode = this.generateAdminRequestCode();

    const organization = await this.prisma.organization.create({
      data: {
        orgName: dto.orgName,
        userId: dto.userId,
        sector: dto.sector,
        licenseId: dto.licenseId,
        contactInfo: dto.contactInfo,
        adminRequestCode: adminRequestCode,
      } as any,
    });

    // Auto-create admin record for organization creator (first admin)
    await this.prisma.admin.create({
      data: {
        userId: dto.userId,
        organizationId: organization.id,
        permissions: { verify: true, manage: true, primary: true },
      } as any,
    });

    return {
      ...organization,
      adminRequestCode: adminRequestCode, // Return code to organization creator
    };
  }

  async getAdminCode(userId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { userId },
      select: { adminRequestCode: true, orgName: true } as any
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    return {
      adminRequestCode: (organization as any).adminRequestCode,
      organizationName: organization.orgName,
      message: 'Share this code with trusted users to allow them to register as admins'
    };
  }

  async regenerateAdminCode(userId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { userId }
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    const newAdminCode = this.generateAdminRequestCode();

    const updated = await this.prisma.organization.update({
      where: { userId },
      data: { adminRequestCode: newAdminCode } as any,
      select: { adminRequestCode: true, orgName: true }
    });

    return {
      newAdminRequestCode: (updated as any).adminRequestCode,
      organizationName: updated.orgName,
      message: 'Admin request code regenerated successfully. Previous code is no longer valid.'
    };
  }

  private generateAdminRequestCode(): string {
    // Simple 6-character code for easy testing: ABC123 format
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let code = '';
    // 3 letters
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // 3 numbers
    for (let i = 0; i < 3; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return code;
  }

  async getOrganizationById(id: string) {
    return await this.prisma.organization.findUnique({
      where: { id },
    });
  }

  async updateOrganization(id: string, dto: any) {
    return await this.prisma.organization.update({
      where: { id },
      data: {
        orgName: dto.orgName,
        sector: dto.sector,
        licenseId: dto.licenseId,
        contactInfo: dto.contactInfo,
      },
    });
  }

  async deleteOrganization(id: string) {
    return await this.prisma.organization.delete({
      where: { id },
    });
  }
}
