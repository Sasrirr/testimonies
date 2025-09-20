import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class EmbedIdService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique embed ID for testimonies
   */
  async generateUniqueEmbedId(length: number = 12): Promise<string> {
    let embedId: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate a URL-safe, random ID
      embedId = nanoid(length);
      
      // Check if this ID already exists
      const existing = await this.prisma.testimony.findUnique({
        where: { embedId },
        select: { id: true },
      });

      if (!existing) {
        isUnique = true;
      }
      
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique embed ID after maximum attempts');
    }

    return embedId;
  }

  /**
   * Validate embed ID format
   */
  validateEmbedId(embedId: string): boolean {
    // Check if embed ID is alphanumeric and proper length
    const embedIdRegex = /^[A-Za-z0-9_-]{8,30}$/;
    return embedIdRegex.test(embedId);
  }

  /**
   * Generate a short, human-readable ID (for admin purposes)
   */
  generateShortId(length: number = 8): string {
    return nanoid(length);
  }
}
