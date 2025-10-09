import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger, CanActivate, ExecutionContext } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from './common/common.module';
import { TestimoniesModule } from './testimonies/testimonies.module';
import { RegistrationModule } from './registration/registration.module';
import { LoginModule } from './login/login.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Logging
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get('LOG_LEVEL', 'info'),
          transport:
            configService.get('NODE_ENV') === 'development'
              ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              }
              : undefined,
          serializers: {
            req: (req) => ({
              id: req.id,
              method: req.method,
              url: req.url,
              headers: {
                host: req.headers.host,
                'user-agent': req.headers['user-agent'],
                'content-type': req.headers['content-type'],
              },
              remoteAddress: req.remoteAddress,
              remotePort: req.remotePort,
            }),
            res: (res) => ({
              statusCode: res.statusCode,
              headers: {
                'content-type': res.headers['content-type'],
                'content-length': res.headers['content-length'],
              },
            }),
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get('THROTTLE_TTL', 60),
        limit: configService.get('THROTTLE_LIMIT', 10),
      }),
      inject: [ConfigService],
    }),

    // Core modules
    // JwtModule should only be imported in AuthModule, not globally
    PrismaModule,
    CommonModule,
    TestimoniesModule,
    AuthModule,
    RegistrationModule,
    LoginModule,
    require('./organizations/organizations.module').OrganizationsModule,
    require('./admin/admin.module').AdminModule,
    require('./verification/verification.module').VerificationModule,
    require('./interactions/interactions.module').InteractionsModule,
  ],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global filters
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Authentication is enforced through JWT guards at controller level
  // No global bypass guards for production security

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // Removed forbidNonWhitelisted to allow extra fields in DTOs
      transform: true,
      disableErrorMessages: configService.get('NODE_ENV') === 'production',
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true, // In production, specify allowed origins
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Flocci Testimonies API')
      .setDescription('Global trusted ledger for verifiable testimonials - Production Ready Demo')
      .setVersion('2.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      }, 'JWT-auth')
      .addTag('testimonies', 'Testimony management operations')
      .addTag('users', 'User-related operations')
      .addTag('organizations', 'Organization management')
      .addTag('admin', 'Administrative operations')
      .addTag('interactions', 'User interactions with testimonies')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log('Swagger documentation available at /api/docs');
  }

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Flocci Testimonies Service is running on port ${port}`);
  logger.log(`📚 Environment: ${configService.get('NODE_ENV', 'development')}`);

  if (configService.get('NODE_ENV') !== 'production') {
    logger.log(`📖 API Documentation: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
