import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is missing; Resend will fall back to process.env.RESEND_API_KEY or fail when sending.',
      );
    }
    this.resend = new Resend(apiKey);
  }

  private getFromAddress(): string {
    return (
      this.configService.get<string>('RESEND_FROM_EMAIL') ??
      'onboarding@resend.dev'
    );
  }

  /**
   * Resend returns `{ data, error }` and does not throw on HTTP/API errors.
   * We must inspect `error` or failed sends look like success.
   */
  private assertEmailSent(
    result: Awaited<ReturnType<Resend['emails']['send']>>,
    context: string,
  ): void {
    if (result.error) {
      const err = result.error;
      const detail =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : JSON.stringify(err);
      this.logger.error(
        `${context}: Resend error — ${detail} (${JSON.stringify(err)})`,
      );
      throw new InternalServerErrorException(
        'Could not send email. Verify RESEND_API_KEY, RESEND_FROM_EMAIL, and Resend domain rules; see server logs.',
      );
    }
    if (result.data?.id) {
      this.logger.log(
        `${context}: Resend accepted email (id=${result.data.id})`,
      );
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const appUrl = this.configService.get<string>('APP_URL');
    if (!appUrl) {
      this.logger.error(
        'APP_URL is not set; verification links will be wrong.',
      );
    }
    const verificationUrl = `${appUrl ?? ''}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    const result = await this.resend.emails.send({
      from: this.getFromAddress(),
      to: email,
      subject: 'Verify your email',
      html: `
        <h2>Welcome! Please verify your email</h2>
        <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
    });

    this.assertEmailSent(result, 'sendVerificationEmail');
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const appUrl = this.configService.get<string>('APP_URL');
    const resetUrl = `${appUrl ?? ''}/api/auth/reset-password?token=${encodeURIComponent(token)}`;

    const result = await this.resend.emails.send({
      from: this.getFromAddress(),
      to: email,
      subject: 'Reset your password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      `,
    });

    this.assertEmailSent(result, 'sendPasswordResetEmail');
  }
}
