import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { Subject } from 'rxjs';

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
    to: string, templateId: string, dynamicTemplateData: Record<string, any>,
  ) {
    const msg = {
      to,
      from: this.fromEmail,
      templateId,
      dynamicTemplateData,
    };
    try {
      await sgMail.send(msg);
    } catch (error) {
      if (error.response) console.error(error.response.body);
      throw error;
    }
  }

  async sendMailWithAttachment(
    to: string, templateId: string, dynamicTemplateData: Record<string, any>,
    attachments: { content: Buffer | string; filename: string; type: string }[]

  ) {

    const sgAttachments = attachments.map(att => ({
      content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
      filename: att.filename,
      type: att.type,
      disposition: 'attachment',
    }));

    const msg = {
      to,
      from: this.fromEmail,
      templateId,
      dynamicTemplateData,
      attachments: sgAttachments,
    };
    try {
      await sgMail.send(msg);
    } catch (error) {
      if (error.response) console.error(error.response.body);
      throw error;
    }
  }


}
