import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [AuthModule, VerificationModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }
