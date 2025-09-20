import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { TestimonyStatus, InteractionType } from '@prisma/client';

export interface ReputationFactors {
  verifiedTestimoniesCreated: number;
  verifiedTestimoniesReceived: number;
  positiveInteractions: number;
  negativeInteractions: number;
  accountAge: number; // in days
  profileCompleteness: number; // 0-1
}

@Injectable()
export class ReputationService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Calculate reputation score for a user
   * This is a stub implementation - in production, this would be more sophisticated
   */
  async calculateReputationScore(userId: string): Promise<number> {
    const factors = await this.gatherReputationFactors(userId);
    
    // Base score
    let score = 75.0;

    // Positive factors
    score += factors.verifiedTestimoniesCreated * 2; // +2 per verified testimony created
    score += factors.verifiedTestimoniesReceived * 1; // +1 per verified testimony received
    score += factors.positiveInteractions * 0.1; // +0.1 per positive interaction
    score += Math.min(factors.accountAge / 30, 10); // +10 max for account age (1 point per 3 days)
    score += factors.profileCompleteness * 10; // +10 for complete profile

    // Negative factors
    score -= factors.negativeInteractions * 0.5; // -0.5 per negative interaction

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Update reputation score for a user
   */
  async updateReputationScore(userId: string): Promise<void> {
    const newScore = await this.calculateReputationScore(userId);

    await this.prisma.reputation.upsert({
      where: { userId },
      update: {
        score: newScore,
        lastCalculatedAt: new Date(),
      },
      create: {
        userId,
        score: newScore,
        lastCalculatedAt: new Date(),
      },
    });

    // Log the reputation update
    await this.auditLogService.log({
      action: `Updated reputation score for user ${userId} to ${newScore}`,
      targetEntity: 'USER',
      targetId: userId,
      details: { newScore },
    });
  }

  /**
   * Batch update reputation scores (for cron job)
   */
  async batchUpdateReputationScores(limit: number = 100): Promise<void> {
    // Get users who need reputation updates (haven't been updated in last 24 hours)
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            reputation: null,
          },
          {
            reputation: {
              lastCalculatedAt: {
                lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          },
        ],
      },
      select: { id: true },
      take: limit,
    });

    // Update reputation for each user
    for (const user of users) {
      try {
        await this.updateReputationScore(user.id);
      } catch (error) {
        console.error(`Failed to update reputation for user ${user.id}:`, error);
      }
    }
  }

  /**
   * Get reputation score for a user
   */
  async getReputationScore(userId: string): Promise<number> {
    const reputation = await this.prisma.reputation.findUnique({
      where: { userId },
    });

    return reputation?.score.toNumber() || 75.0;
  }

  /**
   * Gather factors that influence reputation
   */
  private async gatherReputationFactors(userId: string): Promise<ReputationFactors> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        authoredTestimonies: {
          where: { status: TestimonyStatus.VERIFIED },
        },
        subjectTestimonies: {
          where: { status: TestimonyStatus.VERIFIED },
        },
        interactions: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Count interactions
    const positiveInteractions = user.interactions.filter(
      i => i.interaction === InteractionType.LIKE || i.interaction === InteractionType.SHARE
    ).length;

    const negativeInteractions = user.interactions.filter(
      i => i.interaction === InteractionType.FLAG_REPORT
    ).length;

    // Calculate account age in days
    const accountAge = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate profile completeness (simplified)
    let completeness = 0.3; // Base for having an account
    if (user.fullName) completeness += 0.2;
    if (user.email) completeness += 0.2;
    if (user.phone) completeness += 0.1;
    if (user.profilePhotoUrl) completeness += 0.2;

    return {
      verifiedTestimoniesCreated: user.authoredTestimonies.length,
      verifiedTestimoniesReceived: user.subjectTestimonies.length,
      positiveInteractions,
      negativeInteractions,
      accountAge,
      profileCompleteness: completeness,
    };
  }
}
