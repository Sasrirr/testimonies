import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({ secret: 'temporary-secret', signOptions: { expiresIn: '1h' } }),
    UsersModule,
  ],
  providers: [RolesGuard, AuthService],
  exports: [RolesGuard, AuthService, JwtModule],
})
export class AuthModule { }
