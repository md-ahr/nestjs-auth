import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly emailService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    register(dto: RegisterDto): Promise<{
        message: string;
    }>;
    verifyEmail(token: string, res: Response): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: "user" | "admin";
        };
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: "user" | "admin";
        };
    }>;
    loginWithGoogle(user: {
        email: string;
        firstName: string;
        lastName: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: "user" | "admin";
        };
    }>;
    refresh(refreshToken: string, res: Response): Promise<{
        accessToken: string;
    }>;
    logout(userId: string, res: Response): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    private generateTokens;
    private saveRefreshToken;
    private setRefreshTokenCookie;
    private generatePassword;
}
