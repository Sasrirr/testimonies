import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('testimonies/pending')
  getPendingTestimonies() {
    return this.adminService.getPendingTestimonies();
  }

  @Get('verifications')
  getVerificationHistory() {
    return this.adminService.getVerificationHistory();
  }

  @Post('verifications')
  verifyTestimony(@Body() dto: any) {
    // dto: { testimonyId, outcome, adminId, notes }
    return this.adminService.processVerification(dto);
  }
}
