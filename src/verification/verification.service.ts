import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationSource, TestimonyStatus } from '@prisma/client';
import { CreateVerificationDto } from './dto/verification.dto';
import { QrCodeService } from '../common/services/qr-code.service';

export interface VerificationResult {
  verificationId: string;
  testimonyId: string;
  outcome: string;
  verifiedBy: string;
  verifiedAt: Date;
  qrCodeUrl?: string;
}

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Create a verification record and update testimony status
   */
  async createVerification(dto: CreateVerificationDto): Promise<VerificationResult> {
    const { testimonyId, adminId, outcome, source = 'MANUAL', notes, proofType = 'MANUAL', proofData = {} } = dto;

    // Verify testimony exists and is pending
    const testimony = await this.prisma.testimony.findUnique({
      where: { id: testimonyId },
      include: {
        author: true,
        subject: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!testimony) {
      throw new NotFoundException(`Testimony with ID ${testimonyId} not found`);
    }

    if (testimony.status !== TestimonyStatus.PENDING) {
      throw new BadRequestException(`Testimony ${testimonyId} is not pending verification`);
    }

    // Verify admin user exists and get their organization
    const adminRecord = await this.prisma.admin.findUnique({
      where: { userId: adminId }
    });

    if (!adminRecord) {
      throw new NotFoundException(`Admin user with ID ${adminId} not found`);
    }

    // ORG-SCOPED VALIDATION: Admin can only verify testimonies about their organization
    if (testimony.subject.organization &&
      (adminRecord as any).organizationId !== testimony.subject.organization.id) {
      throw new BadRequestException(
        `Admin can only verify testimonies about their organization. ` +
        `Admin org: ${(adminRecord as any).organizationId}, Testimony subject org: ${testimony.subject.organization.id}`
      );
    }

    // Determine new testimony status
    let newStatus: TestimonyStatus;
    let qrCodeUrl: string | null = null;

    switch (outcome) {
      case 'VERIFIED':
        newStatus = TestimonyStatus.VERIFIED;
        // Generate QR code pointing to public API endpoint
        const testimonyUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/v1/testimonies/embed/${testimony.embedId}`;
        qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(testimonyUrl)}`;
        break;
      case 'REJECTED':
        newStatus = TestimonyStatus.REJECTED;
        break;
      case 'PENDING':
        newStatus = TestimonyStatus.PENDING; // Keep as pending but flag for review
        break;
      default:
        throw new BadRequestException(`Invalid verification outcome: ${outcome}`);
    }

    // Create verification record and update testimony in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create verification record
      const verification = await tx.verification.create({
        data: {
          testimonyId,
          verifiedById: adminId,
          outcome: newStatus,
          source: source as VerificationSource,
          notes: notes || '',
          proofType,
          proofData,
        },
      });

      // Update testimony status and QR code
      await tx.testimony.update({
        where: { id: testimonyId },
        data: {
          status: newStatus,
          qrCodeUrl,
        },
      });

      return verification;
    });

    return {
      verificationId: result.id,
      testimonyId: result.testimonyId,
      outcome: result.outcome,
      verifiedBy: adminId,
      verifiedAt: result.createdAt,
      qrCodeUrl,
    };
  }

  /**
   * Get verification history with optional filters (org-scoped)
   */
  async getVerificationHistoryByOrg(filters: {
    adminUserId: string;
    outcome?: TestimonyStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    // Get admin's organization
    const adminRecord = await this.prisma.admin.findUnique({
      where: { userId: filters.adminUserId }
    });

    if (!adminRecord) {
      throw new NotFoundException('Admin not found');
    }

    const where: any = {
      testimony: {
        subject: {
          organization: {
            id: (adminRecord as any).organizationId
          }
        }
      }
    };

    if (filters.outcome) {
      where.outcome = filters.outcome;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.verification.findMany({
      where,
      include: {
        testimony: {
          select: {
            id: true,
            content: true,
            category: true,
            embedId: true,
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
      take: filters.limit,
    });
  }

  /**
   * Get verification history with optional filters (system-wide - legacy)
   */
  async getVerificationHistory(filters?: {
    adminId?: string;
    outcome?: TestimonyStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.adminId) {
      where.verifiedById = filters.adminId;
    }

    if (filters?.outcome) {
      where.outcome = filters.outcome;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return await this.prisma.verification.findMany({
      where,
      include: {
        testimony: {
          select: {
            id: true,
            content: true,
            embedId: true,
            status: true,
            author: { select: { id: true, fullName: true } },
            subject: { select: { id: true, fullName: true } }
          }
        },
        verifiedBy: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  /**
   * Get verification details by testimony ID
   */
  async getVerificationByTestimony(testimonyId: string) {
    return await this.prisma.verification.findUnique({
      where: { testimonyId },
      include: {
        testimony: {
          select: {
            id: true,
            content: true,
            embedId: true,
            status: true,
            qrCodeUrl: true,
          }
        },
        verifiedBy: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(adminId?: string) {
    const where = adminId ? { verifiedById: adminId } : {};

    const [
      totalVerifications,
      verifiedCount,
      rejectedCount,
      pendingCount,
    ] = await Promise.all([
      this.prisma.verification.count({ where }),
      this.prisma.verification.count({
        where: { ...where, outcome: TestimonyStatus.VERIFIED }
      }),
      this.prisma.verification.count({
        where: { ...where, outcome: TestimonyStatus.REJECTED }
      }),
      this.prisma.verification.count({
        where: { ...where, outcome: TestimonyStatus.PENDING }
      }),
    ]);

    return {
      totalVerifications,
      verifiedCount,
      rejectedCount,
      pendingCount,
      approvalRate: totalVerifications > 0 ? (verifiedCount / totalVerifications * 100).toFixed(2) : 0,
    };
  }

  /**
   * Bulk verification for multiple testimonies
   */
  async bulkVerification(verifications: CreateVerificationDto[]) {
    const results = [];

    for (const verification of verifications) {
      try {
        const result = await this.createVerification(verification);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({
          success: false,
          testimonyId: verification.testimonyId,
          error: error.message
        });
      }
    }

    return {
      total: verifications.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
}