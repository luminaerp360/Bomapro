import { AuthService } from './auth.service';
export declare class InitController {
    private readonly authService;
    constructor(authService: AuthService);
    seedDatabase(seedSecret?: string): Promise<{
        credentials: {
            email: string;
            password: string;
            role: string;
        }[];
        success: boolean;
        message: string;
        users: any[];
    }>;
}
