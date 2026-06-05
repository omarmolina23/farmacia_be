import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BrevoService } from './brevo.service';

@Module({
  imports: [ConfigModule],
  providers: [BrevoService],
  exports: [BrevoService],
})
export class BrevoModule {}
