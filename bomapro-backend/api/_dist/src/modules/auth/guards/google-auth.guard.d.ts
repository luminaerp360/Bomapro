import { ExecutionContext } from '@nestjs/common';
declare const GoogleAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class GoogleAuthGuard extends GoogleAuthGuard_base {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | import("rxjs").Observable<boolean>;
}
export {};
