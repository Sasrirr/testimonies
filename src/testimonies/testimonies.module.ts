import { Module } from '@nestjs/common';
import { TestimoniesController, UsersTestimoniesController } from './testimonies.controller';
import { TestimoniesService } from './testimonies.service';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [TestimoniesController, UsersTestimoniesController],
  providers: [TestimoniesService],
  exports: [TestimoniesService],
})
export class TestimoniesModule {}
