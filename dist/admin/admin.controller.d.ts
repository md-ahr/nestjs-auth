import { UsersService } from "../users/users.service";
export declare class AdminController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        id: string;
        name: string;
        email: string;
        passwordHash: string;
        role: "user" | "admin";
        isVerified: boolean;
        verificationToken: string | null;
        verificationTokenExpiresAt: string | null;
        resetToken: string | null;
        resetTokenExpiresAt: string | null;
        refreshTokenHash: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    remove(id: string): Promise<void>;
}
