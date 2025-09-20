import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TargetEntityType } from '@prisma/client';

export interface AuditLogData {
  actorId?: string;
  action: string;
  targetEntity?: TargetEntityType;
  targetId?: string;
  details?: any;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log an action for audit trail
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: data.actorId,
          action: data.action,
          targetEntity: data.targetEntity,
          targetId: data.targetId,
          details: data.details,
        },
      });
    } catch (error) {
      // Log the error but don't throw - audit logging should not break main flow
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Get audit logs (admin only)
   */
  async getAuditLogs(
    limit: number = 100,
    offset: number = 0,
    targetEntity?: TargetEntityType,
    targetId?: string,
  ) {
    const where: any = {};
    
    if (targetEntity) {
      where.targetEntity = targetEntity;
    }
    
    if (targetId) {
      where.targetId = targetId;
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }
}
