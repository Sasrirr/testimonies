import { Module } from '@nestjs/common';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [PrismaModule, CommonModule, AuthModule], // ← Add AuthModule here
  controllers: [InteractionsController],
  providers: [InteractionsService],
  exports: [InteractionsService],
})
export class InteractionsModule { }