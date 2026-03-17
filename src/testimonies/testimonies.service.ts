import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { QrCodeService } from '@/common/services/qr-code.service';
import { EmbedIdService } from '@/common/services/embed-id.service';
import {
  CreateTestimonyDto,
  UpdateTestimonyDto,
  TestimonyResponseDto,
  EmbedTestimonyResponseDto,
} from './dto/testimony.dto';
import { TestimonyStatus, UserRole } from '@prisma/client';
import { JwtPayload } from '@/auth/guards/jwt-auth.guard';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TestimoniesService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
    private qrCodeService: QrCodeService,
    private embedIdService: EmbedIdService,
  ) { }

  /**
   * Create a new testimony
   *
   * Dev-friendly behavior:
   * - If subjectId does not exist and NODE_ENV !== 'production', create a placeholder user automatically.
   * - In production, original behavior (throw NotFoundException) is preserved.
   */
  async createTestimony(
    createTestimonyDto: CreateTestimonyDto,
    authorId: string,
  ): Promise<TestimonyResponseDto> {
    try {
      const { subjectId, content, category, mediaUrl } = createTestimonyDto;

      if (!subjectId) throw new BadRequestException('subjectId is required');

      // Validate that both author and subject exist
      const [author, subject] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: authorId } }),
        this.prisma.user.findUnique({ where: { id: subjectId } })
      ]);

      if (!author) {
        throw new NotFoundException(`Author user not found: ${authorId}`);
      }

      if (!subject) {
        throw new NotFoundException(`Subject user not found: ${subjectId}. Please ensure the user is registered in the system.`);
      }

      const embedId = await this.embedIdService.generateUniqueEmbedId();
      if (!embedId) throw new Error('Failed to generate embedId');

      const testimony = await this.prisma.testimony.create({
        data: { authorId, subjectId, content, category, mediaUrl, embedId, status: TestimonyStatus.PENDING },
        include: {
          author: { select: { id: true, fullName: true, profilePhotoUrl: true } },
          subject: { select: { id: true, fullName: true, profilePhotoUrl: true } },
        },
      });

      await this.auditLogService.log({
        actorId: authorId,
        action: `Created testimony for user ${subjectId}`,
        targetEntity: 'TESTIMONY',
        targetId: testimony.id,
        details: { content: content?.substring(0, 100) },
      });

      return this.mapToTestimonyResponse(testimony);

    } catch (err) {
      console.error('createTestimony error:', err);
      // Re-throw NotFoundException as-is, convert others to BadRequestException
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new BadRequestException(err.message || 'Internal server error');
    }
  }


  /**
   * Get a single testimony by embed ID (public endpoint)
   */
  async getTestimonyByEmbedId(embedId: string): Promise<EmbedTestimonyResponseDto> {
    const testimony = await this.prisma.testimony.findUnique({
      where: { embedId },
      include: {
        author: {
          select: {
            fullName: true,
            profilePhotoUrl: true,
          },
        },
        subject: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!testimony) {
      throw new NotFoundException('Testimony not found');
    }

    // Only show verified testimonies publicly
    if (testimony.status !== TestimonyStatus.VERIFIED) {
      throw new NotFoundException('Testimony not available');
    }

    return {
      embedId: testimony.embedId,
      authorName: testimony.author.fullName,
      authorPhoto: testimony.author.profilePhotoUrl,
      subjectName: testimony.subject.fullName,
      content: testimony.content,
      category: testimony.category,
      mediaUrl: testimony.mediaUrl,
      isVerified: true,
      createdAt: testimony.createdAt,
      qrCodeUrl: testimony.qrCodeUrl,
    };
  }

  /**
   * Get testimonies by user ID (author or subject)
   */
  async getTestimoniesByUserId(
    userId: string,
    type: 'authored' | 'received' = 'received',
  ): Promise<TestimonyResponseDto[]> {
    const whereClause = type === 'authored'
      ? { authorId: userId }
      : { subjectId: userId };

    const testimonies = await this.prisma.testimony.findMany({
      where: {
        ...whereClause,
        status: TestimonyStatus.VERIFIED, // Only show verified testimonies publicly
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
        subject: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return testimonies.map(this.mapToTestimonyResponse);
  }

  /**
   * Get all public testimonies (verified)
   */
  async getPublicTestimonies(): Promise<TestimonyResponseDto[]> {
    const testimonies = await this.prisma.testimony.findMany({
      where: { status: TestimonyStatus.VERIFIED },
      include: {
        author: {
          select: { id: true, fullName: true, profilePhotoUrl: true },
        },
        subject: {
          select: { id: true, fullName: true, profilePhotoUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return testimonies.map(this.mapToTestimonyResponse);
  }

  /**
   * Get testimonies for a specific business/organization
   */
  async getTestimoniesByBusinessId(businessId: string): Promise<TestimonyResponseDto[]> {
    const testimonies = await this.prisma.testimony.findMany({
      where: { subjectId: businessId, status: TestimonyStatus.VERIFIED },
      include: {
        author: {
          select: { id: true, fullName: true, profilePhotoUrl: true },
        },
        subject: {
          select: { id: true, fullName: true, profilePhotoUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return testimonies.map(this.mapToTestimonyResponse);
  }

  /**
   * Update a testimony (only by author)
   */
  async updateTestimony(
    id: string,
    updateTestimonyDto: UpdateTestimonyDto,
    user: JwtPayload,
  ): Promise<TestimonyResponseDto> {
    const testimony = await this.prisma.testimony.findUnique({
      where: { id },
      include: {
        author: true,
        subject: true,
      },
    });

    if (!testimony) {
      throw new NotFoundException('Testimony not found');
    }

    // Check if user is the author
    if (testimony.authorId !== user.userId) {
      throw new ForbiddenException('You can only update your own testimonies');
    }

    // Don't allow updates to verified testimonies
    if (testimony.status === TestimonyStatus.VERIFIED) {
      throw new BadRequestException('Cannot update verified testimonies');
    }

    const updatedTestimony = await this.prisma.testimony.update({
      where: { id },
      data: updateTestimonyDto,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
        subject: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    // Log the action
    await this.auditLogService.log({
      actorId: user.userId,
      action: `Updated testimony ${id}`,
      targetEntity: 'TESTIMONY',
      targetId: id,
      details: updateTestimonyDto,
    });

    return this.mapToTestimonyResponse(updatedTestimony);
  }

  /**
   * Delete a testimony
   */
  async deleteTestimony(id: string, user: JwtPayload): Promise<void> {
    const testimony = await this.prisma.testimony.findUnique({
      where: { id },
    });

    if (!testimony) {
      throw new NotFoundException('Testimony not found');
    }

    // Check permissions: author can delete their own, admin can delete any
    const canDelete =
      testimony.authorId === user.userId ||
      user.role === UserRole.ADMIN;

    if (!canDelete) {
      throw new ForbiddenException('You can only delete your own testimonies');
    }

    await this.prisma.testimony.delete({
      where: { id },
    });

    // Log the action
    await this.auditLogService.log({
      actorId: user.userId,
      action: `Deleted testimony ${id}`,
      targetEntity: 'TESTIMONY',
      targetId: id,
      details: { reason: 'User deletion' },
    });
  }

  /**
   * Get pending testimonies (admin only)
   */
  async getPendingTestimonies(): Promise<TestimonyResponseDto[]> {
    const testimonies = await this.prisma.testimony.findMany({
      where: {
        status: TestimonyStatus.PENDING,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
        subject: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return testimonies.map(this.mapToTestimonyResponse);
  }

  /**
   * Verify a testimony and generate QR code
   */
  async verifyTestimony(id: string, adminId: string): Promise<void> {
    const testimony = await this.prisma.testimony.findUnique({
      where: { id },
    });

    if (!testimony) {
      throw new NotFoundException('Testimony not found');
    }

    if (testimony.status !== TestimonyStatus.PENDING) {
      throw new BadRequestException('Only pending testimonies can be verified');
    }

    // Generate QR code URL
    const qrCodeUrl = await this.qrCodeService.generateQrCodeUrl(testimony.embedId);

    // Update testimony status and QR code
    await this.prisma.testimony.update({
      where: { id },
      data: {
        status: TestimonyStatus.VERIFIED,
        qrCodeUrl,
      },
    });

    // Log the verification
    await this.auditLogService.log({
      actorId: adminId,
      action: `Verified testimony ${id}`,
      targetEntity: 'TESTIMONY',
      targetId: id,
      details: { qrCodeUrl },
    });
  }

  /**
   * Reject a testimony
   */
  async rejectTestimony(id: string, adminId: string, reason?: string): Promise<void> {
    const testimony = await this.prisma.testimony.findUnique({
      where: { id },
    });

    if (!testimony) {
      throw new NotFoundException('Testimony not found');
    }

    if (testimony.status !== TestimonyStatus.PENDING) {
      throw new BadRequestException('Only pending testimonies can be rejected');
    }

    await this.prisma.testimony.update({
      where: { id },
      data: {
        status: TestimonyStatus.REJECTED,
      },
    });

    // Log the rejection
    await this.auditLogService.log({
      actorId: adminId,
      action: `Rejected testimony ${id}`,
      targetEntity: 'TESTIMONY',
      targetId: id,
      details: { reason },
    });
  }

  /**
   * Map Prisma result to response DTO
   */
  private mapToTestimonyResponse(testimony: any): TestimonyResponseDto {
    return {
      id: testimony.id,
      author: {
        id: testimony.author.id,
        fullName: testimony.author.fullName,
        profilePhotoUrl: testimony.author.profilePhotoUrl,
      },
      subject: {
        id: testimony.subject.id,
        fullName: testimony.subject.fullName,
        profilePhotoUrl: testimony.subject.profilePhotoUrl,
      },
      content: testimony.content,
      category: testimony.category,
      mediaUrl: testimony.mediaUrl,
      sentiment: testimony.sentiment,
      status: testimony.status,
      qrCodeUrl: testimony.qrCodeUrl,
      embedId: testimony.embedId,
      createdAt: testimony.createdAt,
      updatedAt: testimony.updatedAt,
    };
  }

  // Raise a dispute
  async raiseDispute(testimonyId: string, userId: string, reason: string) {
    return this.prisma.dispute.create({
      data: { testimonyId, raisedById: userId, reason },
    });
  }

  // Resolve a dispute (simple MVP: mark outcome and reviewer)
  async resolveDispute(disputeId: string, adminId: string, outcome: 'approved' | 'rejected') {
    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: { reviewedById: adminId, outcome, status: 'RESOLVED' },
    });
  }

  // Get all disputes (optionally unresolved only)
  async getDisputes(unresolvedOnly = false) {
    const whereFilter = unresolvedOnly ? { status: 'OPEN' } : {};
    return this.prisma.dispute.findMany({
      where: whereFilter,
      include: { testimony: true, raisedBy: true, reviewedBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get business reputation
  async getBusinessReputation(businessId: string) {
    const verifiedCount = await this.prisma.testimony.count({
      where: { subjectId: businessId, status: 'VERIFIED' },
    });

    const disputedCount = await this.prisma.dispute.count({
      where: { testimony: { subjectId: businessId } },
    });

    return { businessId, verifiedCount, disputedCount };
  }
}
