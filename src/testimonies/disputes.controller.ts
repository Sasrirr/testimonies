import { Controller, Post, Patch, Get, Param, Body, Req, ForbiddenException } from '@nestjs/common';
import { TestimoniesService } from './testimonies.service';

@Controller('disputes')
export class DisputesController {
    constructor(private readonly testimoniesService: TestimoniesService) { }

    @Post(':id/raise')
    async raiseDispute(
        @Param('id') testimonyId: string,
        @Body('reason') reason: string,
    ) {
        const placeholderUserId = 'public-user'; // or any default string
        return this.testimoniesService.raiseDispute(testimonyId, placeholderUserId, reason);
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
