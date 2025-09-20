import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import JwksClient from 'jwks-client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwksClientInstance: JwksClient;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Initialize JWKS client for Flocci OS integration
    const jwksUrl = this.configService.get<string>('FLOCCI_JWKS_URL');
    this.jwksClientInstance = JwksClient({
      jwksUri: jwksUrl,
      requestHeaders: {},
      timeout: 30000,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('JWT token is required');
    }

    try {
      // Decode JWT header to get the key ID
      const decodedHeader = this.jwtService.decode(token, { complete: true }) as any;
      if (!decodedHeader?.header?.kid) {
        throw new UnauthorizedException('Invalid JWT token structure');
      }

      // Get the signing key from JWKS
      const key = await this.getSigningKey(decodedHeader.header.kid);
      
      // Verify the JWT with the public key
      const payload = this.jwtService.verify(token, {
        algorithms: ['RS256'],
        publicKey: key,
      }) as JwtPayload;

      // Validate required fields
      if (!payload.userId || !payload.email || !payload.role) {
        throw new UnauthorizedException('JWT payload missing required fields');
      }

      // Attach user info to request
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException(`Invalid JWT token: ${error.message}`);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClientInstance.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
        } else {
          const signingKey = key?.getPublicKey();
          resolve(signingKey);
        }
      });
    });
  }
}
