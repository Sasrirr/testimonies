import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { JwtTestController } from './jwt-test.controller';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        console.log('[JwtModule] Registering with secret:', secret);
        return {
          secret,
          signOptions: { expiresIn: '1h' },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  providers: [RolesGuard, AuthService, JwtAuthGuard],
  exports: [RolesGuard, AuthService, JwtModule, JwtAuthGuard],
  controllers: [JwtTestController],
})
export class AuthModule { }
