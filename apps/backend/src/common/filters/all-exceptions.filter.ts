import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';
import { AppLoggerService } from '../logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    @Inject(AppLoggerService) private readonly appLogger: AppLoggerService
  ) { }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (typeof exception.getResponse() === 'string'
          ? exception.getResponse()
          : (exception.getResponse() as any)?.message ||
          (exception.getResponse() as any)?.error ||
          'Internal server error')
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const apiResponse: ApiResponse = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    };

    // Log error with Winston
    const errorDetails = {
      method: request.method,
      url: request.url,
      statusCode: status,
      error: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
      userAgent: request.get('user-agent'),
      ip: request.ip || request.connection.remoteAddress,
      userId: (request as any).user?.id,
      body: request.body ? JSON.stringify(request.body).substring(0, 500) : undefined,
    };

    if (status >= 500) {
      // Log server errors as error level
      this.appLogger.error(
        `${request.method} ${request.url} - ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
        'ExceptionFilter'
      );
      this.appLogger.error(JSON.stringify(errorDetails), undefined, 'ExceptionFilter');
    } else if (status >= 400) {
      // Log client errors as warn level
      this.appLogger.warn(
        `${request.method} ${request.url} - ${status}: ${message}`,
        'ExceptionFilter'
      );
    }

    // Also log to console for development
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    }

    response.status(status).json(apiResponse);
  }
}

