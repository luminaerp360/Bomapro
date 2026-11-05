import { Strategy } from 'passport-jwt';
import { Model } from 'mongoose';
import { RentiumUser } from '../schemas/rentium-user.schema';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private userModel;
    constructor(userModel: Model<RentiumUser>);
    validate(payload: any): Promise<{
        sub: any;
        email: any;
        name: any;
        role: any;
        tenantId: any;
        tenantIds: any;
    }>;
}
export {};
