import { IsEmail } from 'class-validator';

export class SendVerificationCodeDto {
  @IsEmail()
  email: string;
}