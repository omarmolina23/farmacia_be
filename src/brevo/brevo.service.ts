import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';

@Injectable()
export class BrevoService {
  private client: BrevoClient;
  private fromEmail: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not defined in configuration');
    }

    const from = this.config.get<string>('BREVO_FROM_EMAIL');
    if (!from) {
      throw new Error('BREVO_FROM_EMAIL is not defined in configuration');
    }
    this.fromEmail = from;

    this.client = new BrevoClient({ apiKey });
  }

  async sendMail(
    to: string,
    templateId: number,
    params: Record<string, any>,
  ) {
    try {
      await this.client.transactionalEmails.sendTransacEmail({
        to: [{ email: to }],
        sender: { email: this.fromEmail },
        templateId,
        params,
      });
    } catch (error) {
      console.error('Brevo sendMail error:', error?.body ?? error);
      throw error;
    }
  }

  async sendMailWithAttachment(
    to: string,
    templateId: number,
    params: Record<string, any>,
    attachments: { content: Buffer | string; filename: string; type: string }[],
  ) {
    try {
      await this.client.transactionalEmails.sendTransacEmail({
        to: [{ email: to }],
        sender: { email: this.fromEmail },
        templateId,
        params,
        attachment: attachments.map((att) => ({
          content:
            typeof att.content === 'string'
              ? att.content
              : att.content.toString('base64'),
          name: att.filename,
        })),
      });
    } catch (error) {
      console.error('Brevo sendMailWithAttachment error:', error?.body ?? error);
      throw error;
    }
  }
}
