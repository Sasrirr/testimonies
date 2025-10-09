import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, TestimonyStatus, InteractionType } from '@prisma/client';

interface AnalyticsResponse {
  period: string;
  testimonies: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    verificationRate: string;
    dailyTrends: Array<{ date: string; count: number; verified: number }>;
  };
  interactions: {
    total: number;
    byType: Record<InteractionType, number>;
    engagementRate: string;
    trendingTestimonies: Array<{ testimonyId: string; interactions: number; content: string }>;
  };
  organizations: {
    total: number;
    active: number;
    withVerifiedTestimonies: number;
    topPerformers: Array<{ orgName: string; verifiedCount: number; avgRating: number }>;
  };
  users: {
    total: number;
    byRole: Record<UserRole, number>;
    activeContributors: number;
    reputationDistribution: { high: number; medium: number; low: number };
  };
}

@ApiTags('analytics')
@Controller('analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get comprehensive analytics dashboard',
    description: 'Returns comprehensive analytics for admin dashboard including trends, engagement, and performance metrics'
  })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to analyze (default: 30)', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Analytics dashboard data',
    schema: {
      type: 'object',
      properties: {
        period: { type: 'string' },
        testimonies: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            verified: { type: 'number' },
            pending: { type: 'number' },
            rejected: { type: 'number' },
            verificationRate: { type: 'string' },
          },
        },
      },
    },
  })
  async getDashboardAnalytics(
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 30,
  ): Promise<AnalyticsResponse> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [testimoniesData, interactionsData, organizationsData, usersData] = await Promise.all([
      this.getTestimonyAnalytics(startDate),
      this.getInteractionAnalytics(startDate),
      this.getOrganizationAnalytics(startDate),
      this.getUserAnalytics(),
    ]);

    return {
      period: `${days} days`,
      testimonies: testimoniesData,
      interactions: interactionsData,
      organizations: organizationsData,
      users: usersData,
    };
  }

  @Get('testimony-trends')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION)
  @ApiOperation({
    summary: 'Get testimony submission and verification trends',
    description: 'Returns daily trends for testimony submissions and verifications'
  })
  @ApiResponse({ status: 200, description: 'Testimony trends data' })
  async getTestimonyTrends(@Query('days', new ParseIntPipe({ optional: true })) days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyStats = await this.prisma.testimony.groupBy({
      by: ['createdAt', 'status'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Process and format the data
    const trendData: Record<string, { date: string; submitted: number; verified: number }> = {};
    
    dailyStats.forEach(stat => {
      const dateStr = stat.createdAt.toISOString().split('T')[0];
      if (!trendData[dateStr]) {
        trendData[dateStr] = { date: dateStr, submitted: 0, verified: 0 };
      }
      trendData[dateStr].submitted += stat._count;
      if (stat.status === TestimonyStatus.VERIFIED) {
        trendData[dateStr].verified += stat._count;
      }
    });

    return {
      period: `${days} days`,
      trends: Object.values(trendData).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  @Get('engagement-metrics')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZATION)
  @ApiOperation({
    summary: 'Get user engagement metrics',
    description: 'Returns interaction statistics and engagement patterns'
  })
  @ApiResponse({ status: 200, description: 'Engagement metrics' })
  async getEngagementMetrics() {
    const [totalInteractions, interactionsByType, topTestimonies] = await Promise.all([
      this.prisma.interaction.count(),
      this.prisma.interaction.groupBy({
        by: ['interaction'],
        _count: true,
      }),
      this.prisma.interaction.groupBy({
        by: ['targetId'],
        _count: true,
        orderBy: { _count: { interaction: 'desc' } },
        take: 10,
      }),
    ]);

    const engagementByType = interactionsByType.reduce((acc, item) => {
      acc[item.interaction] = item._count;
      return acc;
    }, {} as Record<InteractionType, number>);

    return {
      totalInteractions,
      byType: engagementByType,
      topEngagedTestimonies: topTestimonies.map(t => ({
        testimonyId: t.targetId,
        interactionCount: t._count,
      })),
    };
  }

  private async getTestimonyAnalytics(startDate: Date) {
    const [total, verified, pending, rejected] = await Promise.all([
      this.prisma.testimony.count({ where: { createdAt: { gte: startDate } } }),
      this.prisma.testimony.count({ where: { createdAt: { gte: startDate }, status: TestimonyStatus.VERIFIED } }),
      this.prisma.testimony.count({ where: { createdAt: { gte: startDate }, status: TestimonyStatus.PENDING } }),
      this.prisma.testimony.count({ where: { createdAt: { gte: startDate }, status: TestimonyStatus.REJECTED } }),
    ]);

    const verificationRate = total > 0 ? ((verified / total) * 100).toFixed(1) : '0';

    // Get daily trends (simplified)
    const dailyTrends = await this.getDailyTestimonyTrends(startDate);

    return {
      total,
      verified,
      pending,
      rejected,
      verificationRate: `${verificationRate}%`,
      dailyTrends,
    };
  }

  private async getInteractionAnalytics(startDate: Date) {
    const [total, byTypeData] = await Promise.all([
      this.prisma.interaction.count({ where: { createdAt: { gte: startDate } } }),
      this.prisma.interaction.groupBy({
        by: ['interaction'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
    ]);

    const byType = byTypeData.reduce((acc, item) => {
      acc[item.interaction] = item._count;
      return acc;
    }, {} as Record<InteractionType, number>);

    const totalTestimonies = await this.prisma.testimony.count({ where: { createdAt: { gte: startDate } } });
    const engagementRate = totalTestimonies > 0 ? ((total / totalTestimonies) * 100).toFixed(1) : '0';

    return {
      total,
      byType,
      engagementRate: `${engagementRate}%`,
      trendingTestimonies: [], // Simplified for now
    };
  }

  private async getOrganizationAnalytics(startDate: Date) {
    const [total, withTestimonies] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({
        where: {
          user: {
            subjectTestimonies: {
              some: { createdAt: { gte: startDate } },
            },
          },
        },
      }),
    ]);

    return {
      total,
      active: withTestimonies,
      withVerifiedTestimonies: withTestimonies, // Simplified
      topPerformers: [], // Simplified for now
    };
  }

  private async getUserAnalytics() {
    const [total, byRoleData] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
    ]);

    const byRole = byRoleData.reduce((acc, item) => {
      acc[item.role] = item._count;
      return acc;
    }, {} as Record<UserRole, number>);

    return {
      total,
      byRole,
      activeContributors: byRole[UserRole.CONSUMER] || 0,
      reputationDistribution: { high: 0, medium: 0, low: 0 }, // Simplified for now
    };
  }

  private async getDailyTestimonyTrends(startDate: Date) {
    // Simplified daily trends - in production, you'd use more sophisticated date grouping
    const testimonies = await this.prisma.testimony.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true },
    });

    const dailyData: Record<string, { date: string; count: number; verified: number }> = {};

    testimonies.forEach(testimony => {
      const dateStr = testimony.createdAt.toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { date: dateStr, count: 0, verified: 0 };
      }
      dailyData[dateStr].count++;
      if (testimony.status === TestimonyStatus.VERIFIED) {
        dailyData[dateStr].verified++;
      }
    });

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }
}