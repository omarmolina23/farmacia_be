// filters/file-size-exception.filter.ts

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
  } from '@nestjs/common';
  import { FastifyReply } from 'fastify';
  
  @Catch()
  export class FileSizeExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<FastifyReply>();
  
      if (
        exception?.code === 'FST_PART_LIMIT' ||
        exception?.message?.includes('request file too large')
      ) {
        return response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'El archivo es demasiado grande',
          error: 'Payload Too Large',
        });
      }
  
      throw exception; // Rethrow the exception if it's not a file size issue
    }
  }
  