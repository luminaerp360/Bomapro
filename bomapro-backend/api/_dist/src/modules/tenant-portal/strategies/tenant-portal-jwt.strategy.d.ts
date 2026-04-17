import { Strategy } from 'passport-jwt';
declare const TenantPortalJwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class TenantPortalJwtStrategy extends TenantPortalJwtStrategy_base {
    constructor();
    validate(payload: any): Promise<{
        sub: any;
        email: any;
        name: any;
        orgTenantId: any;
    }>;
}
export {};
