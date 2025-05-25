import { Controller, Get, Post, Body } from '@nestjs/common';
import { TwilioService } from './twilio.service';

@Controller('twilio')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Post('send-code')
  async sendCode(@Body('phone') phone: string) {
    const status = await this.twilioService.sendVerification(phone);
    return { status };
  }

  @Post('verify-code')
  async verifyCode(@Body() body: { phone: string; code: string }) {
    const status = await this.twilioService.checkVerification(
      body.phone,
      body.code,
    );
    return { status };
  }
}
