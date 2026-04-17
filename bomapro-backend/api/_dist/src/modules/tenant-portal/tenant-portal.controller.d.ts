import { TenantPortalService } from './tenant-portal.service';
import { PortalLoginDto, PortalSetupPasswordDto, UpdatePortalProfileDto } from './dto/portal-auth.dto';
import { InitiateMpesaPaymentDto } from './dto/portal-payment.dto';
export declare class TenantPortalController {
    private readonly service;
    constructor(service: TenantPortalService);
    setupPassword(dto: PortalSetupPasswordDto): Promise<{
        message: string;
    }>;
    login(dto: PortalLoginDto): Promise<{
        token: string;
        profile: any;
    }>;
    getProfile(req: any): Promise<any>;
    updateProfile(req: any, dto: UpdatePortalProfileDto): Promise<any>;
    getLease(req: any): Promise<any>;
    signLease(id: string, req: any): Promise<import("mongoose").Document<unknown, {}, import("../leases/schemas/lease.schema").Lease, {}, {}> & import("../leases/schemas/lease.schema").Lease & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getPayments(req: any): Promise<(import("mongoose").Document<unknown, {}, import("../payments/schemas/payment.schema").Payment, {}, {}> & import("../payments/schemas/payment.schema").Payment & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    confirmMpesaPayment(req: any, body: any): Promise<import("mongoose").Document<unknown, {}, import("../payments/schemas/payment.schema").Payment, {}, {}> & import("../payments/schemas/payment.schema").Payment & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    initiateMpesaPayment(req: any, dto: InitiateMpesaPaymentDto): Promise<{
        message: string;
        checkoutRequestId: any;
        paymentId: any;
    }>;
    getPaymentStatus(id: string, req: any): Promise<import("mongoose").Document<unknown, {}, import("../payments/schemas/payment.schema").Payment, {}, {}> & import("../payments/schemas/payment.schema").Payment & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getOrgSettings(req: any): Promise<{
        mpesaClientId: any;
        orgName: any;
    }>;
    getInvoices(req: any): Promise<(import("mongoose").Document<unknown, {}, import("../payments/schemas/payment.schema").Payment, {}, {}> & import("../payments/schemas/payment.schema").Payment & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    mpesaCallback(body: any): Promise<{
        ResultCode: number;
        ResultDesc: string;
    }>;
    getBalance(req: any): Promise<{
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
    submitDamage(req: any, body: any): Promise<import("mongoose").Document<unknown, {}, import("../damages/schemas/damage.schema").Damage, {}, {}> & import("../damages/schemas/damage.schema").Damage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getDamages(req: any): Promise<(import("mongoose").FlattenMaps<import("../damages/schemas/damage.schema").Damage> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    resendReceipt(id: string, req: any): Promise<{
        message: string;
    }>;
    resendInvite(propertyTenantId: string, req: any): Promise<{
        message: string;
    }>;
}
