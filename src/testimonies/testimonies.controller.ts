import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TestimoniesService } from './testimonies.service';
import {
  CreateTestimonyDto,
  UpdateTestimonyDto,
  TestimonyResponseDto,
  EmbedTestimonyResponseDto,
} from './dto/testimony.dto';
import { UserRole } from '@prisma/client';

@ApiTags('testimonies')
@Controller('api/v1/testimonies')
export class TestimoniesController {
  constructor(private readonly testimoniesService: TestimoniesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new testimony (no auth)' })
  @ApiResponse({
    status: 201,
    description: 'Testimony created successfully',
    type: TestimonyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createTestimony(
    @Body(ValidationPipe) createTestimonyDto: CreateTestimonyDto,
  ): Promise<TestimonyResponseDto> {
    // Use a valid UUID for the placeholder user
    const placeholderUserId = '123e4567-e89b-12d3-a456-426614174000';
    return this.testimoniesService.createTestimony(
      createTestimonyDto,
      placeholderUserId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all public verified testimonies' })
  @ApiResponse({
    status: 200,
    description: 'Public testimonies retrieved successfully',
    type: [TestimonyResponseDto],
  })
  async getPublicTestimonies(): Promise<TestimonyResponseDto[]> {
    return this.testimoniesService.getPublicTestimonies();
  }

  @Get('business/:businessId')
  @ApiOperation({ summary: 'Get verified testimonies for a specific business' })
  @ApiParam({ name: 'businessId', description: 'UUID of the business/organization' })
  @ApiResponse({
    status: 200,
    description: 'Business testimonies retrieved successfully',
    type: [TestimonyResponseDto],
  })
  async getTestimoniesByBusinessId(
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ): Promise<TestimonyResponseDto[]> {
    return this.testimoniesService.getTestimoniesByBusinessId(businessId);
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
  @ApiOperation({ summary: 'Update a testimony (author only, no auth)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the testimony to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Testimony updated successfully',
    type: TestimonyResponseDto,
  })
  async updateTestimony(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateTestimonyDto: UpdateTestimonyDto,
  ): Promise<TestimonyResponseDto> {
    const placeholderUser = {
      userId: 'public-user',
      role: UserRole.CONSUMER,
      email: 'public-user@flocci.in',
    };
    return this.testimoniesService.updateTestimony(
      id,
      updateTestimonyDto,
      placeholderUser,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a testimony (no auth)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the testimony to delete',
  })
  @ApiResponse({ status: 204, description: 'Testimony deleted successfully' })
  async deleteTestimony(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const placeholderUser = {
      userId: 'public-user',
      role: UserRole.ADMIN,
      email: 'public-user@flocci.in',
    };
    return this.testimoniesService.deleteTestimony(id, placeholderUser);
  }

  @Get('pending/list')
  @ApiOperation({ summary: 'Get all pending testimonies (admin only, no auth)' })
  @ApiResponse({
    status: 200,
    description: 'Pending testimonies retrieved successfully',
    type: [TestimonyResponseDto],
  })
  async getPendingTestimonies(): Promise<TestimonyResponseDto[]> {
    return this.testimoniesService.getPendingTestimonies();
  }
}

@ApiTags('users')
@Controller('api/v1/users')
export class UsersTestimoniesController {
  constructor(private readonly testimoniesService: TestimoniesService) { }

  @Get(':userId/testimonies')
  @ApiOperation({ summary: 'Get testimonies by user ID' })
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
