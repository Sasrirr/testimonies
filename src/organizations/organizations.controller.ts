import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// ...existing code...
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@Controller('api/v1/organizations')
export class OrganizationsController {
  @Post()
  @UseGuards(JwtAuthGuard)
  createOrganization(@Body() dto: any) {
    return this.organizationsService.createOrganization(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOrganization(@Param('id') id: string) {
    return this.organizationsService.getOrganizationById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateOrganization(@Param('id') id: string, @Body() dto: any) {
    return this.organizationsService.updateOrganization(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteOrganization(@Param('id') id: string) {
    return this.organizationsService.deleteOrganization(id);
  }
  constructor(private readonly organizationsService: OrganizationsService) { }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get organization dashboard/profile' })
  @ApiResponse({ status: 200, description: 'Organization profile retrieved successfully' })
  getOrganizationProfile(@Query('orgId') orgId: string) {
    // Accept orgId as a query parameter for MVP testing
    return this.organizationsService.getOrganizationProfile(orgId);
  }

  @Get('me/testimonies')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all testimonies about organization' })
  @ApiResponse({ status: 200, description: 'Testimonies retrieved successfully' })
  getOrganizationTestimonies(@Query('orgId') orgId: string) {
    return this.organizationsService.getOrganizationTestimonies(orgId);
  }

  @Get('me/testimonies/verified')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get verified testimonies with embed codes' })
  @ApiResponse({ status: 200, description: 'Verified testimonies with embed codes retrieved successfully' })
  getVerifiedOrganizationTestimonies(@Query('orgId') orgId: string) {
    return this.organizationsService.getVerifiedOrganizationTestimonies(orgId);
  }
}
