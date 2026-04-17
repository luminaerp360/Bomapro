import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { PropertyTenant } from '../property-tenants/schemas/property-tenant.schema';
import { Lease } from '../leases/schemas/lease.schema';
import { Payment } from '../payments/schemas/payment.schema';
import { Unit } from '../units/schemas/unit.schema';
import { Tenant } from '../tenants/schemas/tenant.schema';
import { Damage } from '../damages/schemas/damage.schema';
import { PortalLoginDto, PortalSetupPasswordDto, UpdatePortalProfileDto } from './dto/portal-auth.dto';
import { InitiateMpesaPaymentDto } from './dto/portal-payment.dto';
import { MpesaService } from './mpesa.service';
export declare class TenantPortalService {
    private propertyTenantModel;
    private leaseModel;
    private paymentModel;
    private unitModel;
    private tenantOrgModel;
    private damageModel;
    private readonly jwtService;
    private readonly mpesaService;
    private readonly logger;
    constructor(propertyTenantModel: Model<PropertyTenant>, leaseModel: Model<Lease>, paymentModel: Model<Payment>, unitModel: Model<Unit>, tenantOrgModel: Model<Tenant>, damageModel: Model<Damage>, jwtService: JwtService, mpesaService: MpesaService);
    setupPassword(dto: PortalSetupPasswordDto): Promise<{
        message: string;
    }>;
    login(dto: PortalLoginDto): Promise<{
        token: string;
        profile: any;
    }>;
    getProfile(propertyTenantId: string): Promise<any>;
    updateProfile(propertyTenantId: string, dto: UpdatePortalProfileDto): Promise<any>;
    getLease(propertyTenantId: string, orgTenantId: string): Promise<any>;
    signLease(leaseId: string, propertyTenantId: string, orgTenantId: string): Promise<import("mongoose").Document<unknown, {}, Lease, {}, {}> & Lease & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getPayments(propertyTenantId: string, orgTenantId: string): Promise<(import("mongoose").Document<unknown, {}, Payment, {}, {}> & Payment & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getPaymentStatus(paymentId: string, propertyTenantId: string): Promise<import("mongoose").Document<unknown, {}, Payment, {}, {}> & Payment & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    confirmMpesaPayment(propertyTenantId: string, orgTenantId: string, dto: {
        leaseId: string;
        amount: number;
        phoneNumber: string;
        mpesaReceiptNumber: string;
        checkoutRequestId: string;
        paymentPeriod?: string;
        notes?: string;
    }): Promise<import("mongoose").Document<unknown, {}, Payment, {}, {}> & Payment & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getOrgSettings(orgTenantId: string): Promise<{
        mpesaClientId: any;
        orgName: any;
    }>;
    initiateMpesaPayment(propertyTenantId: string, orgTenantId: string, dto: InitiateMpesaPaymentDto): Promise<{
        message: string;
        checkoutRequestId: any;
        paymentId: any;
    }>;
    handleMpesaCallback(body: any): Promise<{
        ResultCode: number;
        ResultDesc: string;
    }>;
    resendInvite(propertyTenantId: string, orgTenantId: string): Promise<{
        message: string;
    }>;
    generateAndSaveInviteToken(tenant: any): Promise<{
        token: string;
    }>;
    private get mailer();
    sendPortalInviteEmail(to: string, name: string, inviteLink: string): Promise<void>;
    private sendReceiptEmail;
    getBalance(propertyTenantId: string, orgTenantId: string): Promise<{
        balance: number;
        totalPaid: number;
        rentAmount: number;
        currency: string;
        overdueMonths: number;
        totalDue?: undefined;
    } | {
        balance: number;
        totalPaid: any;
        totalDue: number;
        rentAmount: any;
        currency: any;
        overdueMonths: number;
    }>;
    submitDamage(propertyTenantId: string, orgTenantId: string, dto: any): Promise<import("mongoose").Document<unknown, {}, Damage, {}, {}> & Damage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getDamages(propertyTenantId: string, orgTenantId: string): Promise<(import("mongoose").FlattenMaps<Damage> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    resendReceiptEmail(paymentId: string, propertyTenantId: string, orgTenantId: string): Promise<{
        message: string;
    }>;
    private sanitize;
}
