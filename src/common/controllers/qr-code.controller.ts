import {
    Controller,
    Get,
    Param,
    Res,
    HttpStatus,
    NotFoundException,
    HttpCode,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { QrCodeService } from '../services/qr-code.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('qr-codes')
@Controller('api/v1/qr')
export class QrCodeController {
    constructor(
        private readonly qrCodeService: QrCodeService,
        private readonly prisma: PrismaService,
    ) { }

    @Get(':embedId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get QR code image for testimony embed ID',
        description: 'Returns QR code PNG image that links to the public testimony embed page. No authentication required.'
    })
    @ApiParam({
        name: 'embedId',
        description: 'Unique embed ID of the testimony',
        example: 'abc123def456'
    })
    @ApiResponse({
        status: 200,
        description: 'QR code image returned successfully',
        content: {
            'image/png': {
                schema: {
                    type: 'string',
                    format: 'binary'
                }
            }
        }
    })
    @ApiResponse({
        status: 404,
        description: 'Testimony with given embed ID not found'
    })
    async getQrCodeImage(
        @Param('embedId') embedId: string,
        @Res() response: Response,
    ): Promise<void> {
        // Verify that testimony with this embedId exists and is verified
        const testimony = await this.prisma.testimony.findUnique({
            where: { embedId },
            select: { id: true, status: true }
        });

        if (!testimony) {
            throw new NotFoundException(`Testimony with embed ID '${embedId}' not found`);
        }

        if (testimony.status !== 'VERIFIED') {
            throw new NotFoundException(`QR code only available for verified testimonies`);
        }

        try {
            // Generate QR code image
            const qrCodeBuffer = await this.qrCodeService.generateQrCodeImage(embedId);

            // Set appropriate headers
            response.setHeader('Content-Type', 'image/png');
            response.setHeader('Content-Length', qrCodeBuffer.length);
            response.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
            response.setHeader('ETag', `"qr-${embedId}"`);

            // Send the image
            response.end(qrCodeBuffer);
        } catch (error) {
            throw new NotFoundException(`Failed to generate QR code: ${error.message}`);
        }
    }
}