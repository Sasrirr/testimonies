import { Module } from '@nestjs/common';
import { TestimoniesController, UsersTestimoniesController } from './testimonies.controller';
import { DisputesController } from './disputes.controller';
import { ReputationController } from './reputation.controller';
import { TestimoniesService } from './testimonies.service';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/auth/auth.module';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { QrCodeService } from '@/common/services/qr-code.service';
import { EmbedIdService } from '@/common/services/embed-id.service';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [
    TestimoniesController,
    UsersTestimoniesController,
    DisputesController,
    ReputationController,
  ],
  providers: [
    TestimoniesService,
    PrismaService,
    AuditLogService,
    QrCodeService,
    EmbedIdService,
  ],
  exports: [TestimoniesService],
})
export class TestimoniesModule { }
