import { Module } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { TwilioController } from './twilio.controller';

@Module({
  providers: [TwilioService],
  controllers: [TwilioController]
})
export class TwilioModule {}
