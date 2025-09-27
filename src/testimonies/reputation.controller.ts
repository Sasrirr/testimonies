import { Controller, Get, Param } from '@nestjs/common';
import { TestimoniesService } from './testimonies.service';

@Controller('reputation')
export class ReputationController {
    constructor(private readonly testimoniesService: TestimoniesService) { }

    @Get('business/:id')
    async getBusinessReputation(@Param('id') businessId: string) {
        return this.testimoniesService.getBusinessReputation(businessId);
    }
}
