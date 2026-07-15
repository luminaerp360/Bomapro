"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MpesaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MpesaService = void 0;
const common_1 = require("@nestjs/common");
const https = require("https");
let MpesaService = MpesaService_1 = class MpesaService {
    constructor() {
        this.logger = new common_1.Logger(MpesaService_1.name);
    }
    get consumerKey() { return process.env.MPESA_CONSUMER_KEY || ''; }
    get consumerSecret() { return process.env.MPESA_CONSUMER_SECRET || ''; }
    get passkey() { return process.env.MPESA_PASSKEY || ''; }
    get shortcode() { return process.env.MPESA_SHORTCODE || '174379'; }
    get callbackUrl() { return process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/tenant-portal/mpesa/callback'; }
    get isSandbox() { return process.env.MPESA_ENVIRONMENT !== 'production'; }
    get baseUrl() {
        return this.isSandbox
            ? 'sandbox.safaricom.co.ke'
            : 'api.safaricom.co.ke';
    }
    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('0'))
            return '254' + cleaned.slice(1);
        if (cleaned.startsWith('254'))
            return cleaned;
        if (cleaned.startsWith('7') || cleaned.startsWith('1'))
            return '254' + cleaned;
        return cleaned;
    }
    httpsRequest(options, body) {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch {
                        resolve(data);
                    }
                });
            });
            req.on('error', reject);
            if (body)
                req.write(body);
            req.end();
        });
    }
    async getAccessToken() {
        const credentials = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        const result = await this.httpsRequest({
            hostname: this.baseUrl,
            path: '/oauth/v1/generate?grant_type=client_credentials',
            method: 'GET',
            headers: { Authorization: `Basic ${credentials}` },
        });
        if (!result.access_token) {
            this.logger.error('M-Pesa token error', result);
            throw new Error('Failed to get M-Pesa access token');
        }
        return result.access_token;
    }
    async stkPush(phone, amount, accountRef, description) {
        const accessToken = await this.getAccessToken();
        const timestamp = new Date()
            .toISOString()
            .replace(/[^0-9]/g, '')
            .slice(0, 14);
        const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
        const formattedPhone = this.formatPhone(phone);
        const body = JSON.stringify({
            BusinessShortCode: this.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: formattedPhone,
            PartyB: this.shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: this.callbackUrl,
            AccountReference: accountRef.slice(0, 20),
            TransactionDesc: description.slice(0, 13),
        });
        const result = await this.httpsRequest({
            hostname: this.baseUrl,
            path: '/mpesa/stkpush/v1/processrequest',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        }, body);
        this.logger.log(`STK Push result: ${JSON.stringify(result)}`);
        return result;
    }
};
exports.MpesaService = MpesaService;
exports.MpesaService = MpesaService = MpesaService_1 = __decorate([
    (0, common_1.Injectable)()
], MpesaService);
//# sourceMappingURL=mpesa.service.js.map