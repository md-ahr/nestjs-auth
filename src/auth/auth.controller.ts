import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import type { User } from 'src/db/schema';
import { AuthService } from './auth.service';
import type { GoogleValidatedUser } from './google.strategy';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

function isGoogleValidatedUser(value: unknown): value is GoogleValidatedUser {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.email === 'string' &&
    typeof v.firstName === 'string' &&
    typeof v.lastName === 'string'
  );
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // POST /api/auth/register
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // GET /api/auth/verify-email?token=...
  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address and auto-login' })
  async verifyEmail(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyEmail(token, res);
  }

  // POST /api/auth/login
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 60s -> 5 requests
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive access + refresh tokens' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  // GET /api/auth/google
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google login redirect' })
  async googleAuth() {
    // redirects to Google
  }

  // GET /api/auth/google/callback
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google login callback' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    if (!isGoogleValidatedUser(user)) {
      throw new UnauthorizedException('Google authentication failed');
    }
    const response = await this.authService.loginWithGoogle(user);
    const token = encodeURIComponent(response.accessToken);
    const rawClient = this.config.get<string>('CLIENT_URL')?.trim();
    const clientUrl = rawClient?.replace(/\/$/, '');
    if (clientUrl) {
      return res.redirect(`${clientUrl}/auth/success?token=${token}`);
    }
    const appUrl = this.config.getOrThrow<string>('APP_URL').replace(/\/$/, '');
    return res.redirect(`${appUrl}/api/auth/oauth-success?token=${token}`);
  }

  /** HTML landing when no CLIENT_URL (SPA) is configured — avoids 404 on same-origin API. */
  @Public()
  @Get('oauth-success')
  @ApiOperation({
    summary: 'OAuth success (API-only dev): shows token + link to Swagger',
  })
  oauthSuccess(@Query('token') token: string, @Res() res: Response) {
    const appUrl = this.config.getOrThrow<string>('APP_URL').replace(/\/$/, '');
    const tokenLiteral = JSON.stringify(token ?? '');
    res.type('html').send(`
      <!DOCTYPE html>
      <html lang="en"><head><meta charset="utf-8"/><title>Signed in</title></head>
        <body style="font-family:system-ui;max-width:42rem;margin:2rem auto;padding:0 1rem">
          <h1>Signed in with Google</h1>
          <p>Copy this access token for API requests (e.g. Swagger Authorize):</p>
          <pre id="t" style="overflow:auto;background:#f4f4f5;padding:1rem;border-radius:8px;word-break:break-all"></pre>
          <p><a href="${appUrl}/api/docs">Open API docs</a></p>
          <script>document.getElementById('t').textContent=${tokenLiteral};</script>
        </body>
      </html>
    `);
  }

  // POST /api/auth/refresh
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string>;
    const refreshToken = cookies?.refreshToken;
    return this.authService.refresh(refreshToken, res);
  }

  // POST /api/auth/logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(user.id, res);
  }

  // GET /api/auth/me
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };
  }

  // POST /api/auth/forgot-password
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 60s -> 3 requests
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // POST /api/auth/reset-password
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
