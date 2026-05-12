"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    resend;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('RESEND_API_KEY');
        if (!apiKey) {
            this.logger.warn('RESEND_API_KEY is missing; Resend will fall back to process.env.RESEND_API_KEY or fail when sending.');
        }
        this.resend = new resend_1.Resend(apiKey);
    }
    getFromAddress() {
        return (this.configService.get('RESEND_FROM_EMAIL') ??
            'onboarding@resend.dev');
    }
    assertEmailSent(result, context) {
        if (result.error) {
            const err = result.error;
            const detail = typeof err === 'object' && err !== null && 'message' in err
                ? String(err.message)
                : JSON.stringify(err);
            this.logger.error(`${context}: Resend error — ${detail} (${JSON.stringify(err)})`);
            throw new common_1.InternalServerErrorException('Could not send email. Verify RESEND_API_KEY, RESEND_FROM_EMAIL, and Resend domain rules; see server logs.');
        }
        if (result.data?.id) {
            this.logger.log(`${context}: Resend accepted email (id=${result.data.id})`);
        }
    }
    async sendVerificationEmail(email, token) {
        const appUrl = this.configService.get('APP_URL');
        if (!appUrl) {
            this.logger.error('APP_URL is not set; verification links will be wrong.');
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
    async sendPasswordResetEmail(email, token) {
        const appUrl = this.configService.get('APP_URL');
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
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map