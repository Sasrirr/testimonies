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
    console.log('[JwtAuthGuard] Authorization header:', request.headers.authorization);
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('JWT token is required');
    }

    try {
      if (process.env.NODE_ENV !== 'production') {
        // Local dev: verify with HS256 and secret
        const secret = this.configService.get<string>('JWT_SECRET');
        console.log('[JwtAuthGuard] Using secret for verification:', secret);
        const decodedHeader = this.jwtService.decode(token, { complete: true }) as any;
        console.log('[JwtAuthGuard] JWT Header:', decodedHeader?.header);
        const payload = this.jwtService.verify(token, {
          secret,
          algorithms: ['HS256'],
        }) as JwtPayload;
        console.log('[JwtAuthGuard] Decoded JWT payload:', payload);
        if (!payload.userId || !payload.email || !payload.role) {
          throw new UnauthorizedException('JWT payload missing required fields');
        }
        request.user = payload;
        return true;
      }
      // Production: verify with RS256 and JWKS
      const decodedHeader = this.jwtService.decode(token, { complete: true }) as any;
      if (!decodedHeader?.header?.kid) {
        throw new UnauthorizedException('Invalid JWT token structure');
      }
      const key = await this.getSigningKey(decodedHeader.header.kid);
      const payload = this.jwtService.verify(token, {
        algorithms: ['RS256'],
        publicKey: key,
      }) as JwtPayload;
      if (!payload.userId || !payload.email || !payload.role) {
        throw new UnauthorizedException('JWT payload missing required fields');
      }
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
