import type { Request, Response } from 'express';
import type { User } from "../db/schema";
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refresh(req: Request, res: Response): Promise<{
        accessToken: string;
    }>;
    logout(user: User, res: Response): Promise<{
        message: string;
    }>;
    me(user: User): {
        id: string;
        email: string;
        name: string;
        role: "user" | "admin";
        isVerified: boolean;
    };
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
