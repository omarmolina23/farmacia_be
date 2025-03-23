import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  const port = process.env.PORT || 3000;

  await app.register(fastifyCookie, {
    secret: process.env.SECRET,
  });

  app.useGlobalPipes(new ValidationPipe({whitelist: true}));
  app.setGlobalPrefix('api');
  
  app.enableCors({
    origin: ['http://localhost:5173'], // Orígenes permitidos
    methods: 'GET,HEAD,PUT,PATCH,POST', // Métodos permitidos
    allowedHeaders: 'Content-Type, Authorization', // Encabezados permitidos
    credentials: true, // Permitir credenciales (cookies, autorizaciones)
  });
  
  await app.listen(port, '0.0.0.0');
}

bootstrap();
