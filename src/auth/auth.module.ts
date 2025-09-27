import { Module } from '@nestjs/common';
import { RolesGuard } from './guards/roles.guard';

@Module({
  providers: [RolesGuard],
  exports: [RolesGuard],  // keep RolesGuard if you still need role enforcement
})
export class AuthModule { }
