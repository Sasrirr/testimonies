import { Module } from '@nestjs/common';
import { AuditLogService } from './services/audit-log.service';
import { QrCodeService } from './services/qr-code.service';
import { EmbedIdService } from './services/embed-id.service';
import { ReputationService } from './services/reputation.service';

@Module({
  providers: [
    AuditLogService,
    QrCodeService,
    EmbedIdService,
    ReputationService,
  ],
  exports: [
    AuditLogService,
    QrCodeService,
    EmbedIdService,
    ReputationService,
  ],
})
export class CommonModule {}
