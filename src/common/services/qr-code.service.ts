import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  constructor(private configService: ConfigService) { }

  /**
   * Generate QR code URL endpoint (preferred method - returns URL to QR image)
   */
  async generateQrCodeUrl(embedId: string): Promise<string> {
    const serverUrl = this.configService.get<string>('SERVER_URL', 'http://localhost:3000');

    // Return URL that points to our QR code endpoint
    return `${serverUrl}/api/api/v1/qr/${embedId}`;
  }

  /**
   * Generate QR code as base64 data URL (legacy method)
   */
  async generateQrCodeDataUrl(embedId: string): Promise<string> {
    const baseUrl = this.configService.get<string>('QR_CODE_BASE_URL');
    const testimonyUrl = `${baseUrl}/${embedId}`;

    try {
      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(testimonyUrl, {
        width: 256,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Generate QR code image for serving via HTTP endpoint
   */
  async generateQrCodeImage(embedId: string): Promise<Buffer> {
    const baseUrl = this.configService.get<string>('QR_CODE_BASE_URL');
    const testimonyUrl = `${baseUrl}/${embedId}`;

    try {
      const qrCodeBuffer = await QRCode.toBuffer(testimonyUrl, {
        type: 'png',
        width: 256,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeBuffer;
    } catch (error) {
      throw new Error(`Failed to generate QR code image: ${error.message}`);
    }
  }

  /**
   * Generate QR code as buffer for file storage
   */
  async generateQrCodeBuffer(embedId: string): Promise<Buffer> {
    const baseUrl = this.configService.get<string>('QR_CODE_BASE_URL');
    const testimonyUrl = `${baseUrl}/${embedId}`;

    try {
      const qrCodeBuffer = await QRCode.toBuffer(testimonyUrl, {
        width: 256,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeBuffer;
    } catch (error) {
      throw new Error(`Failed to generate QR code buffer: ${error.message}`);
    }
  }
}
