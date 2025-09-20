import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'];
    const userId = (request as any).user?.userId;
    
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - start;
          this.logger.log(
            `${method} ${url} - ${response.statusCode} - ${duration}ms`,
            {
              method,
              url,
              statusCode: response.statusCode,
              duration,
              ip,
              userAgent,
              userId,
              responseSize: JSON.stringify(data || {}).length,
            },
          );
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.logger.error(
            `${method} ${url} - ERROR - ${duration}ms`,
            {
              method,
              url,
              duration,
              ip,
              userAgent,
              userId,
              error: error.message,
            },
          );
        },
      }),
    );
  }
}
