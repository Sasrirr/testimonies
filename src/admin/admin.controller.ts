import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('dashboard/stats')
  getDashboardStats(@CurrentUser() user: any) {
    return this.adminService.getDashboardStats(user.userId);
  }

  @Get('testimonies/pending')
  getPendingTestimonies(@CurrentUser() user: any) {
    return this.adminService.getPendingTestimonies(user.userId);
  }

  @Get('verifications')
  getVerificationHistory(@CurrentUser() user: any) {
    return this.adminService.getVerificationHistory(user.userId);
  }

  @Post('verifications')
  verifyTestimony(@Body() dto: any, @CurrentUser() user: any) {
    // dto: { testimonyId, outcome, notes } - adminId comes from JWT
    return this.adminService.processVerification({
      ...dto,
      adminId: user.userId
    });
  }
}
