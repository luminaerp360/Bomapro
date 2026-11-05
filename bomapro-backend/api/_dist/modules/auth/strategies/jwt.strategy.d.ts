import { Strategy } from 'passport-jwt';
<<<<<<< HEAD
import { Model } from 'mongoose';
import { RentiumUser } from '../schemas/rentium-user.schema';
=======
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
<<<<<<< HEAD
    private userModel;
    constructor(userModel: Model<RentiumUser>);
=======
    constructor();
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
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
