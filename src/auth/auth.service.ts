import crypto from 'node:crypto';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { EmailService } from './email.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import type { User } from 'src/db/schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('An account with this email already exist');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString(); // 24 hours from now, stored as text (ISO-8601)

    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      verificationToken,
      verificationTokenExpiresAt,
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return {
      message:
        'Registration Successful. Please check your email to verify your account',
    };
  }

  async verifyEmail(token: string, res: Response) {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user || !user.verificationToken) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      user.verificationTokenExpiresAt &&
      new Date(user.verificationTokenExpiresAt) < new Date()
    ) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new one',
      );
    }

    await this.usersService.update(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    });

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      message: 'Email verified successfully. You are now logged in',
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async loginWithGoogle(user: {
    email: string;
    firstName: string;
    lastName: string;
  }) {
    const existingUser = await this.usersService.findByEmail(user.email);

    if (!existingUser) {
      const randomPassword = this.generatePassword();

      const newUser = await this.usersService.create({
        email: user.email,
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        role: 'user',
        passwordHash: randomPassword,
      });

      const tokens = await this.generateTokens(newUser);

      return {
        accessToken: tokens.accessToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      };
    }

    const tokens = await this.generateTokens(existingUser);

    return {
      accessToken: tokens.accessToken,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
      },
    };
  }

  async refresh(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    let payload: { sub: string; email: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenMatch = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!tokenMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  async logout(userId: string, res: Response) {
    await this.usersService.update(userId, { refreshTokenHash: null });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message:
          'If an account with that email exists, a reset link has been sent.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(
      Date.now() + 60 * 60 * 1000,
    ).toISOString(); // 1 hour

    await this.usersService.update(user.id, {
      resetToken,
      resetTokenExpiresAt,
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message:
        'If an account with that email exists, a reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);

    if (!user || !user.resetToken) {
      throw new BadRequestException('Invalid reset token');
    }

    if (
      user.resetTokenExpiresAt &&
      new Date(user.resetTokenExpiresAt) < new Date()
    ) {
      throw new BadRequestException(
        'Reset token has expired. Please request a new one',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.usersService.update(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null,
    });

    return { message: 'Password reset successful. You can log in.' };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshTokenHash });
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60100, // 7 days
    });
  }

  private generatePassword(): string {
    const length = 8;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let retVal = '';

    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }

    return retVal;
  }
}
