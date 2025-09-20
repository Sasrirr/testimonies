import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TestimoniesService } from './testimonies.service';
import { CreateTestimonyDto, UpdateTestimonyDto, TestimonyResponseDto, EmbedTestimonyResponseDto } from './dto/testimony.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '@/auth/guards/jwt-auth.guard';

@ApiTags('testimonies')
@Controller('api/v1/testimonies')
export class TestimoniesController {
  constructor(private readonly testimoniesService: TestimoniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CONSUMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new testimony' })
  @ApiResponse({
    status: 201,
    description: 'Testimony created successfully',
    type: TestimonyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subject user not found' })
  async createTestimony(
    @Body(ValidationPipe) createTestimonyDto: CreateTestimonyDto,
    @CurrentUser('userId') userId: string,
  ): Promise<TestimonyResponseDto> {
    return this.testimoniesService.createTestimony(createTestimonyDto, userId);
  }

  @Get(':embedId')
  @ApiOperation({ summary: 'Get a testimony by embed ID (public)' })
  @ApiParam({
    name: 'embedId',
    description: 'Unique embed ID of the testimony',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 200,
    description: 'Testimony retrieved successfully',
    type: EmbedTestimonyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Testimony not found or not verified' })
  async getTestimonyByEmbedId(
    @Param('embedId') embedId: string,
  ): Promise<EmbedTestimonyResponseDto> {
    return this.testimoniesService.getTestimonyByEmbedId(embedId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CONSUMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a testimony (author only)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the testimony to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Testimony updated successfully',
    type: TestimonyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot update verified testimonies' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Can only update own testimonies' })
  @ApiResponse({ status: 404, description: 'Testimony not found' })
  async updateTestimony(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateTestimonyDto: UpdateTestimonyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TestimonyResponseDto> {
    return this.testimoniesService.updateTestimony(id, updateTestimonyDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CONSUMER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a testimony' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the testimony to delete',
  })
  @ApiResponse({ status: 204, description: 'Testimony deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Testimony not found' })
  async deleteTestimony(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.testimoniesService.deleteTestimony(id, user);
  }

  @Get('pending/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending testimonies (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Pending testimonies retrieved successfully',
    type: [TestimonyResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getPendingTestimonies(): Promise<TestimonyResponseDto[]> {
    return this.testimoniesService.getPendingTestimonies();
  }
}

@ApiTags('users')
@Controller('api/v1/users')
export class UsersTestimoniesController {
  constructor(private readonly testimoniesService: TestimoniesService) {}

  @Get(':userId/testimonies')
  @ApiOperation({ summary: 'Get testimonies by user ID (public)' })
  @ApiParam({
    name: 'userId',
    description: 'UUID of the user',
  })
  @ApiQuery({
    name: 'type',
    description: 'Type of testimonies to retrieve',
    enum: ['authored', 'received'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Testimonies retrieved successfully',
    type: [TestimonyResponseDto],
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getTestimoniesByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('type') type: 'authored' | 'received' = 'received',
  ): Promise<TestimonyResponseDto[]> {
    return this.testimoniesService.getTestimoniesByUserId(userId, type);
  }
}
