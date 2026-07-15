"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
let InitController = class InitController {
    constructor(authService) {
        this.authService = authService;
    }
    async seedDatabase() {
        const users = [
            {
                name: 'Super Admin',
                email: 'superadmin@bomapro.co.ke',
                password: 'SuperAdmin@2026',
                role: 'super_admin',
                permissions: [
                    'view_dashboard',
                    'view_properties',
                    'create_properties',
                    'edit_properties',
                    'delete_properties',
                    'view_tenants',
                    'create_tenants',
                    'edit_tenants',
                    'delete_tenants',
                    'view_leases',
                    'create_leases',
                    'edit_leases',
                    'delete_leases',
                    'view_payments',
                    'create_payments',
                    'edit_payments',
                    'delete_payments',
                    'view_damages',
                    'create_damages',
                    'edit_damages',
                    'delete_damages',
                    'view_reports',
                    'export_reports',
                    'view_users',
                    'create_users',
                    'edit_users',
                    'delete_users',
                    'view_maintenance_requests',
                    'create_maintenance_requests',
                    'edit_maintenance_requests',
                    'delete_maintenance_requests',
                ],
            },
            {
                name: 'Property Manager',
                email: 'manager@bomapro.co.ke',
                password: 'Manager@2026',
                role: 'manager',
                permissions: [
                    'view_dashboard',
                    'view_properties',
                    'create_properties',
                    'edit_properties',
                    'view_tenants',
                    'create_tenants',
                    'edit_tenants',
                    'view_leases',
                    'create_leases',
                    'edit_leases',
                    'view_payments',
                    'create_payments',
                    'view_damages',
                    'create_damages',
                    'view_maintenance_requests',
                    'create_maintenance_requests',
                    'edit_maintenance_requests',
                ],
            },
            {
                name: 'Test Tenant User',
                email: 'tenant@bomapro.co.ke',
                password: 'Tenant@2026',
                role: 'tenant',
                permissions: [
                    'view_dashboard',
                    'view_leases',
                    'view_lease_details',
                    'sign_leases',
                    'view_payments',
                    'create_payments',
                    'view_maintenance_requests',
                    'create_maintenance_requests',
                    'edit_maintenance_requests',
                ],
            },
            {
                name: 'Accountant',
                email: 'accountant@bomapro.co.ke',
                password: 'Accountant@2026',
                role: 'admin',
                permissions: [
                    'view_dashboard',
                    'view_payments',
                    'view_payment_details',
                    'export_payment_reports',
                    'view_reports',
                    'export_reports',
                    'view_properties',
                    'view_leases',
                ],
            },
        ];
        const seededUsers = [];
        for (const user of users) {
            const result = await this.authService.register({
                name: user.name,
                email: user.email,
                password: user.password,
                role: user.role,
            });
            seededUsers.push({
                email: user.email,
                role: user.role,
                status: 'created',
            });
        }
        return {
            success: true,
            message: 'Database seeded successfully',
            users: seededUsers,
            credentials: users.map((u) => ({
                email: u.email,
                password: u.password,
                role: u.role,
            })),
        };
    }
};
exports.InitController = InitController;
__decorate([
    (0, common_1.Post)('seed'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InitController.prototype, "seedDatabase", null);
exports.InitController = InitController = __decorate([
    (0, common_1.Controller)('api/init'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], InitController);
//# sourceMappingURL=init.controller.js.map