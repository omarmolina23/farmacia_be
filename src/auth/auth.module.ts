import { Module } from '@nestjs/common';
import { join } from 'path';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { SendGridModule } from 'src/sendgrid/sendgrid.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      isGlobal : true, 
    }), 

    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' }
    }),

    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: 465, 
          secure: true, 
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: config.get('MAIL_USER'),
        },
        template: {
          dir: join(__dirname, '..', '..', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
          
        },
      }),
      inject: [ConfigService],
    }),
    SendGridModule
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule { }
