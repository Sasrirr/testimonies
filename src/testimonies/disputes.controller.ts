import { Controller, Post, Patch, Get, Param, Body, Req, ForbiddenException, UseGuards } from '@nestjs/common';
import { TestimoniesService } from './testimonies.service';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('disputes')
export class DisputesController {
    constructor(private readonly testimoniesService: TestimoniesService) { }

    @Post(':id/raise')
    @UseGuards(JwtAuthGuard)
    async raiseDispute(
        @Param('id') testimonyId: string,
        @Body('reason') reason: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.testimoniesService.raiseDispute(testimonyId, user.userId, reason);
    }

    @Patch(':id/resolve')
    async resolveDispute(@Param('id') disputeId: string, @Body('outcome') outcome: 'approved' | 'rejected', @Req() req) {
        // if (req.user.role !== 'ADMIN') throw new ForbiddenException('Only admins can resolve disputes');
        return this.testimoniesService.resolveDispute(disputeId, req.user.userId, outcome);
    }

    @Get()
    async getAllDisputes(@Req() req) {
        return this.testimoniesService.getDisputes();
    }
}
