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
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const tenant_repository_1 = require("./repositories/tenant.repository");
let TenantsService = class TenantsService {
    constructor(tenantRepository) {
        this.tenantRepository = tenantRepository;
    }
    async create(dto, ownerUserId) {
        const slug = dto.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const existing = await this.tenantRepository.findBySlug(slug);
        if (existing) {
            throw new common_1.ConflictException(`Tenant with slug "${slug}" already exists`);
        }
        return this.tenantRepository.create({
            ...dto,
            slug,
            ownerUserId,
        });
    }
    async findAll() {
        return this.tenantRepository.findBy({});
    }
    async findById(id) {
        const tenant = await this.tenantRepository.findById(id);
        if (!tenant || tenant.isDeleted) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async findBySlug(slug) {
        const tenant = await this.tenantRepository.findBySlug(slug);
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async findByIds(ids) {
        return this.tenantRepository.findByIds(ids);
    }
    async findByOwner(ownerUserId) {
        return this.tenantRepository.findByOwner(ownerUserId);
    }
    async update(id, dto) {
        const tenant = await this.tenantRepository.update(id, dto);
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        return tenant;
    }
    async remove(id) {
        return this.tenantRepository.delete(id);
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_repository_1.TenantRepository])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map