import { Controller, Post, Body } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegisterDto } from './dto/register.dto';

@Controller('api/v1/registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  async register(@Body() dto: RegisterDto) {
    return this.registrationService.register(dto);
  }
}
