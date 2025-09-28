import { Controller, Get, Post, Body, Query, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { CreateVerificationDto } from './dto/verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TestimonyStatus } from '@prisma/client';

@ApiTags('verification')
@Controller('api/v1/verification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a verification record (Admin only)' })
  @ApiResponse({ status: 201, description: 'Verification created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Testimony or admin not found' })
  @Roles('ADMIN')
  async createVerification(
    @Body(ValidationPipe) createVerificationDto: CreateVerificationDto,
  ) {
    return this.verificationService.createVerification(createVerificationDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get verification history (Admin only)' })
  @ApiQuery({ name: 'adminId', required: false, description: 'Filter by admin ID' })
  @ApiQuery({ name: 'outcome', required: false, enum: TestimonyStatus, description: 'Filter by outcome' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit number of results' })
  @ApiResponse({ status: 200, description: 'Verification history retrieved successfully' })
  @Roles('ADMIN')
  async getVerificationHistory(
    @Query('adminId') adminId?: string,
    @Query('outcome') outcome?: TestimonyStatus,
    @Query('limit') limit?: number,
  ) {
    return this.verificationService.getVerificationHistory({
      adminId,
      outcome,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('testimony/:id')
  @ApiOperation({ summary: 'Get verification by testimony ID' })
  @ApiResponse({ status: 200, description: 'Verification retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  @Roles('ADMIN', 'ORGANIZATION')
  async getVerificationByTestimony(@Param('id') testimonyId: string) {
    return this.verificationService.getVerificationByTestimony(testimonyId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get verification statistics (Admin only)' })
  @ApiQuery({ name: 'adminId', required: false, description: 'Filter stats by admin ID' })
  @ApiResponse({ status: 200, description: 'Verification statistics retrieved successfully' })
  @Roles('ADMIN')
  async getVerificationStats(@Query('adminId') adminId?: string) {
    return this.verificationService.getVerificationStats(adminId);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk verification of testimonies (Admin only)' })
  @ApiResponse({ status: 201, description: 'Bulk verification completed' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Roles('ADMIN')
  async bulkVerification(
    @Body() verifications: CreateVerificationDto[],
  ) {
    return this.verificationService.bulkVerification(verifications);
  }
}