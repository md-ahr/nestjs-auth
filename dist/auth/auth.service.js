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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const email_service_1 = require("./email.service");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    emailService;
    constructor(usersService, jwtService, configService, emailService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
    }
    async register(dto) {
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new common_1.ConflictException('An account with this email already exist');
        }
        const passwordHash = await bcryptjs_1.default.hash(dto.password, 12);
        const verificationToken = node_crypto_1.default.randomBytes(32).toString('hex');
        const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const user = await this.usersService.create({
            email: dto.email,
            name: dto.name,
            passwordHash,
            verificationToken,
            verificationTokenExpiresAt,
        });
        await this.emailService.sendVerificationEmail(user.email, verificationToken);
        return {
            message: 'Registration Successful. Please check your email to verify your account',
        };
    }
    async verifyEmail(token, res) {
        const user = await this.usersService.findByVerificationToken(token);
        if (!user || !user.verificationToken) {
            throw new common_1.BadRequestException('Invalid verification token');
        }
        if (user.verificationTokenExpiresAt &&
            new Date(user.verificationTokenExpiresAt) < new Date()) {
            throw new common_1.BadRequestException('Verification token has expired. Please request a new one');
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
    async login(dto, res) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const passwordMatch = await bcryptjs_1.default.compare(dto.password, user.passwordHash);
        if (!passwordMatch) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.isVerified) {
            throw new common_1.UnauthorizedException('Please verify your email before logging in');
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
    async refresh(refreshToken, res) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('No refresh token provided');
        }
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.usersService.findById(payload.sub);
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const tokenMatch = await bcryptjs_1.default.compare(refreshToken, user.refreshTokenHash);
        if (!tokenMatch) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        this.setRefreshTokenCookie(res, tokens.refreshToken);
        return { accessToken: tokens.accessToken };
    }
    async logout(userId, res) {
        await this.usersService.update(userId, { refreshTokenHash: null });
        res.clearCookie('refresh_token');
        return { message: 'Logged out successfully' };
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return {
                message: 'If an account with that email exists, a reset link has been sent.',
            };
        }
        const resetToken = node_crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await this.usersService.update(user.id, {
            resetToken,
            resetTokenExpiresAt,
        });
        await this.emailService.sendPasswordResetEmail(user.email, resetToken);
        return {
            message: 'If an account with that email exists, a reset link has been sent.',
        };
    }
    async resetPassword(token, newPassword) {
        const user = await this.usersService.findByResetToken(token);
        if (!user || !user.resetToken) {
            throw new common_1.BadRequestException('Invalid reset token');
        }
        if (user.resetTokenExpiresAt &&
            new Date(user.resetTokenExpiresAt) < new Date()) {
            throw new common_1.BadRequestException('Reset token has expired. Please request a new one');
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await this.usersService.update(user.id, {
            passwordHash,
            resetToken: null,
            resetTokenExpiresAt: null,
        });
        return { message: 'Password reset successful. You can log in.' };
    }
    async generateTokens(user) {
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
    async saveRefreshToken(userId, refreshToken) {
        const refreshTokenHash = await bcryptjs_1.default.hash(refreshToken, 10);
        await this.usersService.update(userId, { refreshTokenHash });
    }
    setRefreshTokenCookie(res, refreshToken) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60100,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map