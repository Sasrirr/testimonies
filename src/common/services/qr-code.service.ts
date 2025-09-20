import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  constructor(private configService: ConfigService) {}

  /**
   * Generate QR code URL for a testimony embed ID
   */
  async generateQrCodeUrl(embedId: string): Promise<string> {
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
