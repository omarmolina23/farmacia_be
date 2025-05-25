import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  private client: Twilio;
  private serviceSid: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_SERVICE_SID;
    if (!serviceSid) {
      throw new Error('TWILIO_SERVICE_SID environment variable is not defined');
    }
    this.serviceSid = serviceSid;

    this.client = new Twilio(accountSid, authToken);
  }

  async sendVerification(to: string): Promise<string> {
    try {
      const verification = await this.client.verify.v2
        .services(this.serviceSid)
        .verifications.create({ to, channel: 'sms' });

      return verification.status;
    } catch (error) {
      throw new Error('Failed to send verification code');
    }
  }

  async checkVerification(to: string, code: string): Promise<string> {
    try {
      const verificationCheck = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({ to, code });

      return verificationCheck.status;
    } catch (error) {
      throw new Error('Failed to send verification code');
    }
  }
}
