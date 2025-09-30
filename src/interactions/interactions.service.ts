import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { CreateInteractionDto, InteractionResponseDto } from './dto/interaction.dto';
import { InteractionType } from '@prisma/client';

@Injectable()
export class InteractionsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Create a new interaction
   */
  async createInteraction(
    createInteractionDto: CreateInteractionDto,
    userId: string,
  ): Promise<InteractionResponseDto> {
    const { targetType, targetId, interaction, metadata } = createInteractionDto;

    // Validate target exists based on type
    await this.validateTarget(targetType, targetId);

    // Prevent duplicate interactions for certain types
    if (interaction === InteractionType.LIKE || interaction === InteractionType.FLAG_REPORT) {
      const existingInteraction = await this.prisma.interaction.findFirst({
        where: {
          userId,
          targetType,
          targetId,
          interaction,
        },
      });

      if (existingInteraction) {
        throw new BadRequestException(`You have already ${interaction.toLowerCase()}d this ${targetType.toLowerCase()}`);
      }
    }

    // Create the interaction
    const newInteraction = await this.prisma.interaction.create({
      data: {
        userId,
        targetType,
        targetId,
        interaction,
        metadata,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    // Log the interaction
    await this.auditLogService.log({
      actorId: userId,
      action: `Created ${interaction} interaction on ${targetType} ${targetId}`,
      targetEntity: targetType,
      targetId,
      details: { interaction, metadata },
    });

    return this.mapToInteractionResponse(newInteraction);
  }

  /**
   * Get interactions for a testimony
   */
  async getInteractionsByTestimony(
    testimonyId: string,
    interactionType?: InteractionType,
  ): Promise<InteractionResponseDto[]> {
    const where: any = {
      targetType: 'TESTIMONY',
      targetId: testimonyId,
    };

    if (interactionType) {
      where.interaction = interactionType;
    }

    const interactions = await this.prisma.interaction.findMany({
      where,
      include: {
        user: {
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

    return interactions.map(this.mapToInteractionResponse);
  }

  /**
   * Get interactions for a user
   */
  async getInteractionsByUser(
    userId: string,
    interactionType?: InteractionType,
  ): Promise<InteractionResponseDto[]> {
    const where: any = {
      targetType: 'USER',
      targetId: userId,
    };

    if (interactionType) {
      where.interaction = interactionType;
    }

    const interactions = await this.prisma.interaction.findMany({
      where,
      include: {
        user: {
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

    return interactions.map(this.mapToInteractionResponse);
  }

  /**
   * Get interactions for an organization
   */
  async getInteractionsByOrganization(
    organizationId: string,
    interactionType?: InteractionType,
  ): Promise<InteractionResponseDto[]> {
    const where: any = {
      targetType: 'ORGANIZATION',
      targetId: organizationId,
    };

    if (interactionType) {
      where.interaction = interactionType;
    }

    const interactions = await this.prisma.interaction.findMany({
      where,
      include: {
        user: {
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

    return interactions.map(this.mapToInteractionResponse);
  }

  /**
   * Get interactions created by a specific user
   */
  async getUserInteractions(
    userId: string,
    interactionType?: InteractionType,
    targetType?: string,
  ): Promise<InteractionResponseDto[]> {
    const where: any = {
      userId,
    };

    if (interactionType) {
      where.interaction = interactionType;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    const interactions = await this.prisma.interaction.findMany({
      where,
      include: {
        user: {
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

    return interactions.map(this.mapToInteractionResponse);
  }

  /**
   * Get interaction statistics for a target
   */
  async getInteractionStats(targetType: string, targetId: string) {
    const stats = await this.prisma.interaction.groupBy({
      by: ['interaction'],
      where: {
        targetType: targetType as any,
        targetId,
      },
      _count: {
        interaction: true,
      },
    });

    const result = {
      total: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      views: 0,
      flags: 0,
    };

    stats.forEach(stat => {
      const count = stat._count.interaction;
      result.total += count;
      
      switch (stat.interaction) {
        case InteractionType.LIKE:
          result.likes = count;
          break;
        case InteractionType.SHARE:
          result.shares = count;
          break;
        case InteractionType.COMMENT:
          result.comments = count;
          break;
        case InteractionType.VIEW:
          result.views = count;
          break;
        case InteractionType.FLAG_REPORT:
          result.flags = count;
          break;
      }
    });

    return result;
  }

  /**
   * Remove an interaction (unlike, unshare, etc.)
   */
  async removeInteraction(
    targetType: string,
    targetId: string,
    interaction: InteractionType,
    userId: string,
  ): Promise<void> {
    const existingInteraction = await this.prisma.interaction.findFirst({
      where: {
        userId,
        targetType: targetType as any,
        targetId,
        interaction,
      },
    });

    if (!existingInteraction) {
      throw new NotFoundException('Interaction not found');
    }

    await this.prisma.interaction.delete({
      where: {
        id: existingInteraction.id,
      },
    });

    // Log the removal
    await this.auditLogService.log({
      actorId: userId,
      action: `Removed ${interaction} interaction from ${targetType} ${targetId}`,
      targetEntity: targetType as any,
      targetId,
      details: { interaction },
    });
  }

  /**
   * Validate that the target entity exists
   */
  private async validateTarget(targetType: string, targetId: string): Promise<void> {
    switch (targetType) {
      case 'TESTIMONY':
        const testimony = await this.prisma.testimony.findUnique({
          where: { id: targetId },
          select: { id: true },
        });
        if (!testimony) {
          throw new NotFoundException('Testimony not found');
        }
        break;
      
      case 'USER':
        const user = await this.prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true },
        });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        break;
      
      case 'ORGANIZATION':
        const organization = await this.prisma.organization.findUnique({
          where: { id: targetId },
          select: { id: true },
        });
        if (!organization) {
          throw new NotFoundException('Organization not found');
        }
        break;
      
      default:
        throw new BadRequestException('Invalid target type');
    }
  }

  /**
   * Map Prisma result to response DTO
   */
  private mapToInteractionResponse(interaction: any): InteractionResponseDto {
    return {
      id: interaction.id.toString(),
      user: {
        id: interaction.user.id,
        fullName: interaction.user.fullName,
        profilePhotoUrl: interaction.user.profilePhotoUrl,
      },
      targetType: interaction.targetType,
      targetId: interaction.targetId,
      interaction: interaction.interaction,
      metadata: interaction.metadata,
      createdAt: interaction.createdAt,
    };
  }
}
