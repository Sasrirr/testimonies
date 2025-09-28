import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('jwt-test')
export class JwtTestController {
  @Get()
  @UseGuards(JwtAuthGuard)
  test(@Req() req: any) {
    return req.user;
  }
}