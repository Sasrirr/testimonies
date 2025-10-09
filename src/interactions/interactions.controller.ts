import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto, InteractionResponseDto } from './dto/interaction.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { InteractionType } from '@prisma/client';

@ApiTags('interactions')
@Controller('api/v1/interactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new interaction',
    description: 'Create interactions like likes, comments, flags on testimonies, users, or organizations'
  })
  @ApiResponse({
    status: 201,
    description: 'Interaction created successfully',
    type: InteractionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - duplicate interaction or invalid data' })
  @ApiResponse({ status: 404, description: 'Target entity not found' })
  async createInteraction(
    @Body() createInteractionDto: CreateInteractionDto,
    @CurrentUser() user: any,
  ): Promise<InteractionResponseDto> {
    return this.interactionsService.createInteraction(createInteractionDto, user.userId);
  }

  @Get('testimony/:testimonyId')
  @ApiOperation({
    summary: 'Get interactions for a testimony',
    description: 'Retrieve all interactions (likes, comments, flags) for a specific testimony'
  })
  @ApiParam({ name: 'testimonyId', description: 'UUID of the testimony' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: InteractionType,
    description: 'Filter by interaction type'
  })
  @ApiResponse({
    status: 200,
    description: 'Interactions retrieved successfully',
    type: [InteractionResponseDto]
  })
  async getTestimonyInteractions(
    @Param('testimonyId') testimonyId: string,
    @Query('type') interactionType?: InteractionType,
  ): Promise<InteractionResponseDto[]> {
    return this.interactionsService.getInteractionsByTestimony(testimonyId, interactionType);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get interactions for a user',
    description: 'Retrieve all interactions directed at a specific user'
  })
  @ApiParam({ name: 'userId', description: 'UUID of the user' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: InteractionType,
    description: 'Filter by interaction type'
  })
  @ApiResponse({
    status: 200,
    description: 'User interactions retrieved successfully',
    type: [InteractionResponseDto]
  })
  async getUserInteractions(
    @Param('userId') userId: string,
    @Query('type') interactionType?: InteractionType,
  ): Promise<InteractionResponseDto[]> {
    return this.interactionsService.getInteractionsByUser(userId, interactionType);
  }

  @Get('organization/:organizationId')
  @ApiOperation({
    summary: 'Get interactions for an organization',
    description: 'Retrieve all interactions directed at a specific organization'
  })
  @ApiParam({ name: 'organizationId', description: 'UUID of the organization' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: InteractionType,
    description: 'Filter by interaction type'
  })
  @ApiResponse({
    status: 200,
    description: 'Organization interactions retrieved successfully',
    type: [InteractionResponseDto]
  })
  async getOrganizationInteractions(
    @Param('organizationId') organizationId: string,
    @Query('type') interactionType?: InteractionType,
  ): Promise<InteractionResponseDto[]> {
    return this.interactionsService.getInteractionsByOrganization(organizationId, interactionType);
  }

  @Get('stats/:targetType/:targetId')
  @ApiOperation({
    summary: 'Get interaction statistics',
    description: 'Get aggregated statistics for interactions on a specific target'
  })
  @ApiParam({ name: 'targetType', enum: ['TESTIMONY', 'USER', 'ORGANIZATION'] })
  @ApiParam({ name: 'targetId', description: 'UUID of the target entity' })
  @ApiResponse({
    status: 200,
    description: 'Interaction statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalInteractions: { type: 'number' },
        likes: { type: 'number' },
        comments: { type: 'number' },
        shares: { type: 'number' },
        flags: { type: 'number' },
        views: { type: 'number' }
      }
    }
  })
  async getInteractionStats(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.interactionsService.getInteractionStats(targetType, targetId);
  }

  @Get('my-interactions')
  @ApiOperation({
    summary: 'Get current user\'s interactions',
    description: 'Retrieve all interactions created by the current user'
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: InteractionType,
    description: 'Filter by interaction type'
  })
  @ApiQuery({
    name: 'targetType',
    required: false,
    enum: ['TESTIMONY', 'USER', 'ORGANIZATION'],
    description: 'Filter by target type'
  })
  @ApiResponse({
    status: 200,
    description: 'User interactions retrieved successfully',
    type: [InteractionResponseDto]
  })
  async getMyInteractions(
    @CurrentUser() user: any,
    @Query('type') interactionType?: InteractionType,
    @Query('targetType') targetType?: string,
  ): Promise<InteractionResponseDto[]> {
    return this.interactionsService.getUserInteractions(
      user.userId,
      interactionType,
      targetType
    );
  }

  @Delete(':targetType/:targetId/:interactionType')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove an interaction',
    description: 'Remove a specific interaction (unlike, unshare, etc.)'
  })
  @ApiParam({ name: 'targetType', enum: ['TESTIMONY', 'USER', 'ORGANIZATION'] })
  @ApiParam({ name: 'targetId', description: 'UUID of the target entity' })
  @ApiParam({ name: 'interactionType', enum: InteractionType })
  @ApiResponse({ status: 204, description: 'Interaction removed successfully' })
  @ApiResponse({ status: 404, description: 'Interaction not found' })
  async removeInteraction(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Param('interactionType') interactionType: InteractionType,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.interactionsService.removeInteraction(
      targetType,
      targetId,
      interactionType,
      user.userId,
    );
  }
}