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
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TestimoniesService } from './testimonies.service';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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
  @ApiOperation({ summary: 'Create a new testimony (auth required)' })
  @ApiResponse({
    status: 201,
    description: 'Testimony created successfully',
    type: TestimonyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @UseGuards(JwtAuthGuard)
  async createTestimony(
    @Body(ValidationPipe) createTestimonyDto: CreateTestimonyDto,
    @Req() req: any,
  ): Promise<TestimonyResponseDto> {
    // Extract user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }

    return this.testimoniesService.createTestimony(
      createTestimonyDto,
      userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all public verified testimonies (auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Public testimonies retrieved successfully',
    type: [TestimonyResponseDto],
  })
  @UseGuards(JwtAuthGuard)
  async getPublicTestimonies(): Promise<TestimonyResponseDto[]> {
    return this.testimoniesService.getPublicTestimonies();
  }

  @Get('business/:businessId')
  @ApiOperation({ summary: 'Get verified testimonies for a specific business (auth required)' })
  @ApiParam({ name: 'businessId', description: 'UUID of the business/organization' })
  @ApiResponse({
    status: 200,
    description: 'Business testimonies retrieved successfully',
    type: [TestimonyResponseDto],
  })
  @UseGuards(JwtAuthGuard)
  async getTestimoniesByBusinessId(
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ): Promise<TestimonyResponseDto[]> {
    return this.testimoniesService.getTestimoniesByBusinessId(businessId);
  }

  @Get('embed/:embedId')
  @ApiOperation({ summary: 'Get a testimony by embed ID (public access)' })
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
  async getPublicTestimonyByEmbedId(
    @Param('embedId') embedId: string,
  ): Promise<EmbedTestimonyResponseDto> {
    return this.testimoniesService.getTestimonyByEmbedId(embedId);
  }

  @Get(':embedId')
  @ApiOperation({ summary: 'Get a testimony by embed ID (auth required)' })
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
  @UseGuards(JwtAuthGuard)
  async getTestimonyByEmbedId(
    @Param('embedId') embedId: string,
  ): Promise<EmbedTestimonyResponseDto> {
    return this.testimoniesService.getTestimonyByEmbedId(embedId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a testimony (author only, auth required)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the testimony to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Testimony updated successfully',
    type: TestimonyResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  async updateTestimony(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateTestimonyDto: UpdateTestimonyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TestimonyResponseDto> {
    return this.testimoniesService.updateTestimony(
      id,
      updateTestimonyDto,
      user,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a testimony (auth required)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the testimony to delete',
  })
  @ApiResponse({ status: 204, description: 'Testimony deleted successfully' })
  @UseGuards(JwtAuthGuard)
  async deleteTestimony(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.testimoniesService.deleteTestimony(id, user);
  }

  @Get('pending/list')
  @ApiOperation({ summary: 'Get all pending testimonies (admin only, auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Pending testimonies retrieved successfully',
    type: [TestimonyResponseDto],
  })
  @UseGuards(JwtAuthGuard)
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
