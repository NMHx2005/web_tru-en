import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip maintenance check for settings endpoint (needed to get maintenance status)
    if (req.path === '/api/settings') {
      return next();
    }

    // Skip maintenance check for admin routes (admin can always access)
    if (req.path.startsWith('/api/admin')) {
      return next();
    }

    try {
      // Get settings from database
      const settings = await this.prisma.settings.findFirst();

      // If maintenance mode is enabled
      if (settings?.maintenanceMode) {
        // Check if user is admin
        const token = req.cookies?.['access_token'] ||
          req.headers.authorization?.replace('Bearer ', '');

        let isAdmin = false;

        if (token) {
          try {
            const payload = this.jwtService.verify(token, {
              secret: this.configService.get<string>('JWT_SECRET'),
            });

            // Check if user is admin
            if (payload?.role === 'ADMIN') {
              isAdmin = true;
            }
          } catch (error) {
            // Token invalid or expired, user is not admin
            isAdmin = false;
          }
        }

        // If user is not admin, show maintenance message
        if (!isAdmin) {
          throw new HttpException(
            {
              success: false,
              error: 'Website đang bảo trì',
              message: settings.maintenanceMessage || 'Website đang được bảo trì. Vui lòng quay lại sau.',
              maintenanceMode: true,
            },
            HttpStatus.SERVICE_UNAVAILABLE
          );
        }
      }
    } catch (error) {
      // If error is already HttpException (maintenance mode), re-throw it
      if (error instanceof HttpException) {
        throw error;
      }
      // Otherwise, log error and continue (don't block if settings check fails)
      console.error('Error checking maintenance mode:', error);
    }

    next();
  }
}
