import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private verificationService: VerificationService,
  ) { }

  async getDashboardStats(adminUserId?: string) {
    if (adminUserId) {
      // Org-scoped stats for admin
      const adminRecord = await this.prisma.admin.findUnique({
        where: { userId: adminUserId }
      });

      if (!adminRecord) {
        throw new BadRequestException('User is not an admin');
      }

      const orgId = (adminRecord as any).organizationId;

      const testimoniesCount = await this.prisma.testimony.count({
        where: { subject: { organization: { id: orgId } } }
      });

      const verifiedCount = await this.prisma.testimony.count({
        where: {
          status: 'VERIFIED',
          subject: { organization: { id: orgId } }
        }
      });

      const pendingCount = await this.prisma.testimony.count({
        where: {
          status: 'PENDING',
          subject: { organization: { id: orgId } }
        }
      });

      return {
        testimoniesCount,
        verifiedCount,
        pendingCount,
        organizationScope: true
      };
    } else {
      // System-wide stats (fallback)
      const testimoniesCount = await this.prisma.testimony.count();
      const organizationsCount = await this.prisma.organization.count();
      const usersCount = await this.prisma.user.count();
      return { testimoniesCount, organizationsCount, usersCount };
    }
  }

  async getPendingTestimonies(adminUserId: string) {
    // Get admin's organization info directly from admin table
    const adminRecord = await this.prisma.admin.findUnique({
      where: { userId: adminUserId }
    });

    if (!adminRecord) {
      throw new BadRequestException('User is not an admin');
    }

    // Fetch testimonies that are about users in the admin's organization
    return await this.prisma.testimony.findMany({
      where: {
        status: 'PENDING',
        subject: {
          organization: {
            id: (adminRecord as any).organizationId  // Type assertion for now
          }
        }
      },
      include: {
        author: { select: { fullName: true, email: true } },
        subject: {
          select: {
            fullName: true,
            email: true,
            organization: { select: { orgName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVerificationHistory(adminUserId: string) {
    // Get admin's organization info directly from admin table
    const adminRecord = await this.prisma.admin.findUnique({
      where: { userId: adminUserId }
    });

    if (!adminRecord) {
      throw new BadRequestException('User is not an admin');
    }

    // Fetch verifications only for testimonies about the admin's organization
    return await this.prisma.verification.findMany({
      where: {
        testimony: {
          subject: {
            organization: {
              id: (adminRecord as any).organizationId  // Type assertion for now
            }
          }
        }
      },
      include: {
        testimony: {
          include: {
            author: { select: { fullName: true, email: true } },
            subject: {
              select: {
                fullName: true,
                email: true,
                organization: { select: { orgName: true } }
              }
            }
          }
        },
        verifiedBy: { select: { fullName: true, email: true } }
      },
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
