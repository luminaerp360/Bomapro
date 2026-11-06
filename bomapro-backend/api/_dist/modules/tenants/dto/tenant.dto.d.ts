import { TenantPlan } from '../schemas/tenant.schema';
export declare class CreateTenantDto {
    name: string;
    slug: string;
    domain?: string;
    logoUrl?: string;
    plan?: TenantPlan;
    contactEmail?: string;
    billingEmail?: string;
    maxUsers?: number;
    maxProperties?: number;
}
declare const UpdateTenantDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateTenantDto>>;
export declare class UpdateTenantDto extends UpdateTenantDto_base {
    isActive?: boolean;
    mpesaClientId?: string;
    supportPhone?: string;
    companyAddress?: string;
    notificationEmails?: string[];
    smtpConfig?: {
        useCustomSmtp?: boolean;
        host?: string;
        port?: number;
        secure?: boolean;
        user?: string;
        pass?: string;
        fromEmail?: string;
        fromName?: string;
    };
    notificationPreferences?: {
        emailTenantOnPayment?: boolean;
        emailAdminsOnPayment?: boolean;
        emailTenantOnInvoiceDue?: boolean;
        emailAdminsOnOverdue?: boolean;
        publicPortalUrl?: string;
    };
    billingSettings?: {
        defaultCurrency?: string;
        defaultPaymentDueDay?: number;
        defaultGracePeriodDays?: number;
        defaultLeaseDurationMonths?: number;
        paybillOrTillNumber?: string;
        bankAccountDetails?: string;
        paymentInstructions?: string;
    };
    settings?: Record<string, any>;
}
export {};
