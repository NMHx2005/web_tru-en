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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) { }

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
      const isCrossOrigin = frontendDomain !== backendDomain;
      const isHttps = frontendUrl.startsWith('https://') || req.protocol === 'https';

      // Detect iOS Safari - Safari has stricter cookie requirements
      const userAgent = req.get('user-agent') || '';
      const isIOSSafari = /iPhone|iPad|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS|OPiOS/.test(userAgent);

      // Determine if we should set domain (only if frontend and backend share a common root domain)
      // Safari on iOS has issues with domain cookies, so we avoid setting domain when possible
      let cookieDomain: string | undefined = undefined;
      if (isCrossOrigin && !isIOSSafari) {
        // Only set domain for non-iOS browsers to avoid Safari issues
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

      // Cookie options for iOS Safari:
      // - Must use SameSite=None with Secure=true for cross-origin
      // - Should not set domain to avoid Safari restrictions
      // - Must use HTTPS for Secure cookies
      const cookieOptions: any = {
        httpOnly: true,
        secure: isCrossOrigin && isHttps ? true : (isProduction && isHttps),
        sameSite: isCrossOrigin && isHttps ? 'none' : 'lax',
        path: '/',
      };

      // Only set domain if not iOS Safari and we have a valid shared root domain
      if (cookieDomain && !isIOSSafari) {
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

      // Instead of redirecting directly, redirect to a cookie-setting endpoint first
      // This ensures cookies are set properly before redirecting to frontend
      res.redirect(`${backendUrl}/api/auth/set-cookie?token=${tokens.accessToken}&redirect=${encodeURIComponent(`${frontendUrl}/auth/callback?token=${tokens.accessToken}`)}`);
    } catch {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }

  @Public()
  @Get('set-cookie')
  async setCookie(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.query.token as string;
      const redirectUrl = req.query.redirect as string;

      if (!token) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=invalid_token`);
      }

      // Verify token and get payload
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const isProduction = process.env.NODE_ENV === 'production';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const frontendDomain = new URL(frontendUrl).hostname;
      const backendUrl = process.env.BACKEND_URL || req.protocol + '://' + req.get('host');
      const backendDomain = new URL(backendUrl).hostname;
      const isCrossOrigin = frontendDomain !== backendDomain;
      const isHttps = frontendUrl.startsWith('https://') || req.protocol === 'https';

      // Generate new tokens from payload (to ensure refresh token is also set)
      const tokens = await this.authService.generateTokens({
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role,
      });

      // Detect iOS Safari - Safari has stricter cookie requirements
      const userAgent = req.get('user-agent') || '';
      const isIOSSafari = /iPhone|iPad|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS|OPiOS/.test(userAgent);

      // Determine cookie domain
      // Note: Safari on iOS has issues with domain cookies, so we avoid setting domain when possible
      let cookieDomain: string | undefined = undefined;
      if (isCrossOrigin && !isIOSSafari) {
        // Only set domain for non-iOS browsers to avoid Safari issues
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

      // Cookie options for iOS Safari:
      // - Must use SameSite=None with Secure=true for cross-origin
      // - Should not set domain to avoid Safari restrictions
      // - Must use HTTPS for Secure cookies
      const cookieOptions: any = {
        httpOnly: true,
        secure: isCrossOrigin && isHttps ? true : (isProduction && isHttps),
        sameSite: isCrossOrigin && isHttps ? 'none' : 'lax',
        path: '/',
      };

      // Only set domain if not iOS Safari and we have a valid shared root domain
      if (cookieDomain && !isIOSSafari) {
        cookieOptions.domain = cookieDomain;
      }

      // Set cookies
      res.cookie('access_token', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      // Redirect to frontend
      const finalRedirect = redirectUrl || `${frontendUrl}/auth/callback?token=${tokens.accessToken}`;
      res.redirect(finalRedirect);
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
      const isCrossOrigin = frontendDomain !== backendDomain;
      const isHttps = frontendUrl.startsWith('https://') || req.protocol === 'https';

      // Detect iOS Safari
      const userAgent = req.get('user-agent') || '';
      const isIOSSafari = /iPhone|iPad|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS|OPiOS/.test(userAgent);

      // Determine if we should set domain (only if frontend and backend share a common root domain)
      // Safari on iOS has issues with domain cookies, so we avoid setting domain when possible
      let cookieDomain: string | undefined = undefined;
      if (isCrossOrigin && !isIOSSafari) {
        // Only set domain for non-iOS browsers
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

      // Cookie options for iOS Safari:
      // - Must use SameSite=None with Secure=true for cross-origin
      // - Should not set domain to avoid Safari restrictions
      // - Must use HTTPS for Secure cookies
      const cookieOptions: any = {
        httpOnly: true,
        secure: isCrossOrigin && isHttps ? true : (isProduction && isHttps),
        sameSite: isCrossOrigin && isHttps ? 'none' : 'lax',
        path: '/',
      };

      // Only set domain if not iOS Safari and we have a valid shared root domain
      if (cookieDomain && !isIOSSafari) {
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

