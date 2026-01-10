import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { CookieInterceptor } from './interceptors/cookie.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';

@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('register')
  @UseInterceptors(CookieInterceptor)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CookieInterceptor)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: any, @Res() res: Response) {
    await this.authService.logout(user.id);
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });
    return res.json({
      success: true,
      message: 'Đăng xuất thành công',
      timestamp: new Date().toISOString(),
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CookieInterceptor)
  async refreshToken(@Req() req: Request) {
    const refreshToken = req.cookies?.['refresh_token'] || req.body.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token không được cung cấp');
    }
    return this.authService.refreshToken(refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    await this.authService.changePassword(user.id, changePasswordDto);
    return {
      message: 'Đổi mật khẩu thành công',
    };
  }

  @Post('update-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateEmail(
    @CurrentUser() user: any,
    @Body() updateEmailDto: UpdateEmailDto
  ) {
    return this.authService.updateEmail(user.id, updateEmailDto.email);
  }

  // OAuth Routes
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as any;
      if (!user || !user.id || !user.email || !user.username || !user.role) {
        throw new UnauthorizedException('Authentication failed');
      }

      const tokens = await this.authService.generateTokens({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      // Set cookies manually (don't use CookieInterceptor for redirects)
      const isProduction = process.env.NODE_ENV === 'production';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const frontendDomain = new URL(frontendUrl).hostname;
      const backendUrl = process.env.BACKEND_URL || req.protocol + '://' + req.get('host');
      const backendDomain = new URL(backendUrl).hostname;

      // Determine if we should set domain (only if frontend and backend share a common root domain)
      // For example: api.example.com and example.com -> set domain to ".example.com"
      let cookieDomain: string | undefined = undefined;
      if (isProduction && frontendDomain !== backendDomain) {
        // Extract root domain (e.g., "example.com" from "api.example.com" or "www.example.com")
        const frontendParts = frontendDomain.split('.');
        const backendParts = backendDomain.split('.');
        
        // If both have at least 2 parts and share the same root domain
        if (frontendParts.length >= 2 && backendParts.length >= 2) {
          const frontendRoot = frontendParts.slice(-2).join('.');
          const backendRoot = backendParts.slice(-2).join('.');
          
          if (frontendRoot === backendRoot) {
            cookieDomain = `.${frontendRoot}`;
          }
        }
      }

      const cookieOptions: any = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in production
        path: '/',
      };

      if (cookieDomain) {
        cookieOptions.domain = cookieDomain;
      }

      // Set access token cookie
      res.cookie('access_token', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Set refresh token cookie
      res.cookie('refresh_token', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}`);
    } catch {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }

  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {
    // Guard redirects to Facebook
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as any;
      if (!user || !user.id || !user.email || !user.username || !user.role) {
        throw new UnauthorizedException('Authentication failed');
      }

      // Check if user needs to provide email (placeholder email detected)
      const needsEmail = user.email?.includes('@facebook.placeholder');

      const tokens = await this.authService.generateTokens({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      // Set cookies manually (don't use CookieInterceptor for redirects)
      const isProduction = process.env.NODE_ENV === 'production';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const frontendDomain = new URL(frontendUrl).hostname;
      const backendUrl = process.env.BACKEND_URL || req.protocol + '://' + req.get('host');
      const backendDomain = new URL(backendUrl).hostname;

      // Determine if we should set domain (only if frontend and backend share a common root domain)
      let cookieDomain: string | undefined = undefined;
      if (isProduction && frontendDomain !== backendDomain) {
        const frontendParts = frontendDomain.split('.');
        const backendParts = backendDomain.split('.');
        
        if (frontendParts.length >= 2 && backendParts.length >= 2) {
          const frontendRoot = frontendParts.slice(-2).join('.');
          const backendRoot = backendParts.slice(-2).join('.');
          
          if (frontendRoot === backendRoot) {
            cookieDomain = `.${frontendRoot}`;
          }
        }
      }

      const cookieOptions: any = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
      };

      if (cookieDomain) {
        cookieOptions.domain = cookieDomain;
      }

      // Set access token cookie
      res.cookie('access_token', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Set refresh token cookie
      res.cookie('refresh_token', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // If user needs email, redirect to email collection page
      if (needsEmail) {
        res.redirect(`${frontendUrl}/auth/complete-email?token=${tokens.accessToken}&needsEmail=true`);
      } else {
        res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}`);
      }
    } catch {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
}

