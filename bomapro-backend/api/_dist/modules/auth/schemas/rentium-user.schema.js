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
exports.RentiumUserSchema = exports.RentiumUser = exports.DEFAULT_TENANT_PERMISSIONS = exports.DEFAULT_AGENT_PERMISSIONS = exports.DEFAULT_MANAGER_PERMISSIONS = exports.DEFAULT_ADMIN_PERMISSIONS = exports.ALL_PERMISSIONS = exports.Permission = exports.RentiumUserRole = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const base_schema_1 = require("../../database/schemas/base.schema");
var RentiumUserRole;
(function (RentiumUserRole) {
    RentiumUserRole["SUPER_ADMIN"] = "super_admin";
    RentiumUserRole["ADMIN"] = "admin";
    RentiumUserRole["MANAGER"] = "manager";
    RentiumUserRole["AGENT"] = "agent";
    RentiumUserRole["TENANT"] = "tenant";
})(RentiumUserRole || (exports.RentiumUserRole = RentiumUserRole = {}));
var Permission;
(function (Permission) {
    Permission["VIEW_DASHBOARD"] = "view_dashboard";
    Permission["VIEW_PROPERTIES"] = "view_properties";
    Permission["CREATE_PROPERTIES"] = "create_properties";
    Permission["EDIT_PROPERTIES"] = "edit_properties";
    Permission["DELETE_PROPERTIES"] = "delete_properties";
    Permission["VIEW_TENANTS"] = "view_tenants";
    Permission["CREATE_TENANTS"] = "create_tenants";
    Permission["EDIT_TENANTS"] = "edit_tenants";
    Permission["DELETE_TENANTS"] = "delete_tenants";
    Permission["VIEW_LEASES"] = "view_leases";
    Permission["CREATE_LEASES"] = "create_leases";
    Permission["EDIT_LEASES"] = "edit_leases";
    Permission["DELETE_LEASES"] = "delete_leases";
    Permission["SIGN_LEASE"] = "sign_lease";
    Permission["VIEW_PAYMENTS"] = "view_payments";
    Permission["CREATE_PAYMENTS"] = "create_payments";
    Permission["EDIT_PAYMENTS"] = "edit_payments";
    Permission["DELETE_PAYMENTS"] = "delete_payments";
    Permission["VIEW_DAMAGES"] = "view_damages";
    Permission["CREATE_DAMAGES"] = "create_damages";
    Permission["EDIT_DAMAGES"] = "edit_damages";
    Permission["DELETE_DAMAGES"] = "delete_damages";
    Permission["VIEW_REPORTS"] = "view_reports";
    Permission["EXPORT_REPORTS"] = "export_reports";
    Permission["VIEW_USERS"] = "view_users";
    Permission["CREATE_USERS"] = "create_users";
    Permission["EDIT_USERS"] = "edit_users";
    Permission["DELETE_USERS"] = "delete_users";
    Permission["CREATE_MAINTENANCE_REQUESTS"] = "create_maintenance_requests";
    Permission["VIEW_MAINTENANCE_REQUESTS"] = "view_maintenance_requests";
    Permission["EDIT_MAINTENANCE_REQUESTS"] = "edit_maintenance_requests";
})(Permission || (exports.Permission = Permission = {}));
exports.ALL_PERMISSIONS = Object.values(Permission);
exports.DEFAULT_ADMIN_PERMISSIONS = exports.ALL_PERMISSIONS;
exports.DEFAULT_MANAGER_PERMISSIONS = [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROPERTIES,
    Permission.CREATE_PROPERTIES,
    Permission.EDIT_PROPERTIES,
    Permission.VIEW_TENANTS,
    Permission.CREATE_TENANTS,
    Permission.EDIT_TENANTS,
    Permission.VIEW_LEASES,
    Permission.CREATE_LEASES,
    Permission.EDIT_LEASES,
    Permission.VIEW_PAYMENTS,
    Permission.CREATE_PAYMENTS,
    Permission.EDIT_PAYMENTS,
    Permission.VIEW_DAMAGES,
    Permission.CREATE_DAMAGES,
    Permission.EDIT_DAMAGES,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_USERS,
];
exports.DEFAULT_AGENT_PERMISSIONS = [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROPERTIES,
    Permission.VIEW_TENANTS,
    Permission.VIEW_LEASES,
    Permission.VIEW_PAYMENTS,
    Permission.CREATE_PAYMENTS,
    Permission.VIEW_DAMAGES,
    Permission.CREATE_DAMAGES,
    Permission.VIEW_REPORTS,
];
exports.DEFAULT_TENANT_PERMISSIONS = [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_LEASES,
    Permission.SIGN_LEASE,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_DAMAGES,
    Permission.CREATE_DAMAGES,
    Permission.CREATE_MAINTENANCE_REQUESTS,
    Permission.VIEW_MAINTENANCE_REQUESTS,
    Permission.EDIT_MAINTENANCE_REQUESTS,
];
let RentiumUser = class RentiumUser extends base_schema_1.BaseDocument {
};
exports.RentiumUser = RentiumUser;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], RentiumUser.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], RentiumUser.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], RentiumUser.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: RentiumUserRole, default: RentiumUserRole.AGENT }),
    __metadata("design:type", String)
], RentiumUser.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], RentiumUser.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], RentiumUser.prototype, "assignedPropertyIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], enum: Permission, default: exports.DEFAULT_AGENT_PERMISSIONS }),
    __metadata("design:type", Array)
], RentiumUser.prototype, "permissions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], RentiumUser.prototype, "googleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], RentiumUser.prototype, "avatar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], RentiumUser.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], RentiumUser.prototype, "isEmailVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], RentiumUser.prototype, "verificationToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], RentiumUser.prototype, "isApproved", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['credentials', 'google', 'local'], default: 'credentials' }),
    __metadata("design:type", String)
], RentiumUser.prototype, "authProvider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], RentiumUser.prototype, "tenantIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], RentiumUser.prototype, "activeTenantId", void 0);
exports.RentiumUser = RentiumUser = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], RentiumUser);
exports.RentiumUserSchema = mongoose_1.SchemaFactory.createForClass(RentiumUser);
exports.RentiumUserSchema.pre('save', function normalizeLegacyAuthProvider(next) {
    if (this.authProvider === 'local') {
        this.authProvider = 'credentials';
    }
    next();
});
exports.RentiumUserSchema.index({ googleId: 1 }, { sparse: true });
//# sourceMappingURL=rentium-user.schema.js.map