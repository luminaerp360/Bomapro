export declare class MpesaService {
    private readonly logger;
    private get consumerKey();
    private get consumerSecret();
    private get passkey();
    private get shortcode();
    private get callbackUrl();
    private get isSandbox();
    private get baseUrl();
    formatPhone(phone: string): string;
    private httpsRequest;
    getAccessToken(): Promise<string>;
    stkPush(phone: string, amount: number, accountRef: string, description: string): Promise<any>;
}
