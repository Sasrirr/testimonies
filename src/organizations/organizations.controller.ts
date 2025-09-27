import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@Controller('api/v1/organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get organization dashboard/profile' })
  @ApiResponse({ status: 200, description: 'Organization profile retrieved successfully' })
  getOrganizationProfile(@Query('orgId') orgId: string) {
    // Accept orgId as a query parameter for MVP testing
    return this.organizationsService.getOrganizationProfile(orgId);
  }

  @Get('me/testimonies')
  @ApiOperation({ summary: 'Get all testimonies about organization' })
  @ApiResponse({ status: 200, description: 'Testimonies retrieved successfully' })
  getOrganizationTestimonies(@Query('orgId') orgId: string) {
    return this.organizationsService.getOrganizationTestimonies(orgId);
  }

  @Get('me/testimonies/verified')
  @ApiOperation({ summary: 'Get verified testimonies with embed codes' })
  @ApiResponse({ status: 200, description: 'Verified testimonies with embed codes retrieved successfully' })
  getVerifiedOrganizationTestimonies(@Query('orgId') orgId: string) {
    return this.organizationsService.getVerifiedOrganizationTestimonies(orgId);
  }
}
