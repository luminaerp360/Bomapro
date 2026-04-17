import { AuthService } from './auth.service';
export declare class InitController {
    private readonly authService;
    constructor(authService: AuthService);
    seedDatabase(): Promise<{
        success: boolean;
        message: string;
        users: any[];
        credentials: {
            email: string;
            password: string;
            role: string;
        }[];
    }>;
}
