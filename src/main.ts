import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySwagger from '@fastify/swagger'; // Importar fastify-swagger
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  const globalPrefix = 'api';
  const port = process.env.PORT || 3000;

  const config = new DocumentBuilder()
    .setTitle('Farmacia Nueva Esperanza')
    .setDescription('Farmacia Nueva Esperanza API')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`/${globalPrefix}`) 
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.register(fastifyCookie, {
    secret: process.env.SECRET,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix(globalPrefix);

  app.enableCors({
    origin: ['http://localhost:5173'], // Orígenes permitidos
    methods: 'GET,HEAD,PUT,PATCH,POST', // Métodos permitidos
    allowedHeaders: 'Content-Type, Authorization', // Encabezados permitidos
    credentials: true, // Permitir credenciales (cookies, autorizaciones)
  });

  await app.listen(port, '0.0.0.0');
}

bootstrap();
