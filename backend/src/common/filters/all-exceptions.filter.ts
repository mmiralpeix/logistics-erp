import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      // NestJS built-in exceptions (ValidationPipe errors, NotFoundException, etc.)
      status = exception.getStatus();
      const exRes = exception.getResponse();
      if (typeof exRes === 'object' && exRes !== null) {
        message = (exRes as any).message || exception.message;
        error = (exRes as any).error || 'Error';
      } else {
        message = exception.message;
        error = 'Error';
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma constraint violations, unique errors, FK errors
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          const fields = (exception.meta?.target as string[])?.join(', ') || 'campo';
          message = `Ya existe un registro con el mismo valor en: ${fields}`;
          error = 'Conflicto de datos';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Referencia inválida: el registro relacionado no existe';
          error = 'Error de referencia';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'El registro solicitado no fue encontrado';
          error = 'No encontrado';
          break;
        case 'P2021':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `La tabla no existe en la base de datos (${exception.meta?.table || 'desconocida'}). Ejecute npx prisma db push.`;
          error = 'Tabla no encontrada';
          break;
        case 'P1001':
          status = HttpStatus.SERVICE_UNAVAILABLE;
          message = 'No se pudo conectar con el servidor de la base de datos en Railway. Verifique DATABASE_URL.';
          error = 'Sin conexión a Base de Datos';
          break;
        case 'P1000':
          status = HttpStatus.UNAUTHORIZED;
          message = 'Autenticación fallida con el servidor de base de datos.';
          error = 'Error de credenciales DB';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `Error de base de datos (${exception.code}: ${exception.message})`;
          error = 'Error interno DB';
      }
      this.logger.error(`Prisma ${exception.code}: ${exception.message}`, exception.stack);
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Error de validación en los datos enviados';
      error = 'Datos inválidos';
      this.logger.error(`Prisma Validation: ${exception.message}`);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      const detailMsg = exception instanceof Error ? exception.message : String(exception);
      message = `Error interno del servidor: ${detailMsg}`;
      error = 'Internal Server Error';
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${detailMsg}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
