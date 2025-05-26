import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyWebsocket from '@fastify/websocket';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { fastifyMultipart } from '@fastify/multipart';
import { FileSizeExceptionFilter } from './filters/file-size-exception.filter';


async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  await app.register(fastifyWebsocket);

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
    },
  })

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

  app.useGlobalFilters(new FileSizeExceptionFilter());
  app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const messages = errors.map((error) =>
        error.constraints ? Object.values(error.constraints).join(', ') : ''
      );
      return new BadRequestException(messages);
    },
  }),
);

  app.setGlobalPrefix(globalPrefix);

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://www.drogueriane.site',
        'https://drogueriane.site',
      ];

      const regex = /^https:\/\/farmacia-[a-zA-Z0-9]+-project\.vercel\.app$/;

      if (!origin || allowedOrigins.includes(origin) || regex.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });


  await app.listen(port, '0.0.0.0');
}

bootstrap();
