import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridService {
  private fromEmail: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not defined in configuration');
    }

    const from = this.config.get<string>('SENDGRID_FROM_EMAIL');
    if (!from) {
      throw new Error('SENDGRID_FROM_EMAIL is not defined in configuration');
    }
    this.fromEmail = from;

    sgMail.setApiKey(apiKey);
  }

  async sendMail(
    to: string,
    templateId: string,
    dynamicTemplateData: Record<string, any>,
  ) {
    const msg = {
      to,
      from: this.fromEmail,
      templateId,
      dynamicTemplateData,
    };
    try {
      await sgMail.send(msg);
      console.log(`Correo enviado a ${to} usando template ${templateId}`);
    } catch (error) {
      console.error('Error enviando correo con SendGrid:', error);
      if (error.response) console.error(error.response.body);
      throw error;
    }
  }
}
