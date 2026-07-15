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
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const property_repository_1 = require("./repositories/property.repository");
let PropertiesService = class PropertiesService {
    constructor(propertyRepository) {
        this.propertyRepository = propertyRepository;
    }
    async generatePropertyCode(tenantId) {
        const count = await this.propertyRepository.countByTenant(tenantId);
        const code = `PROP-${String(count + 1).padStart(5, '0')}`;
        return code;
    }
    async create(dto, tenantId) {
        const propertyCode = dto.propertyCode || await this.generatePropertyCode(tenantId);
        return this.propertyRepository.create({
            ...dto,
            tenantId,
            propertyCode,
            floors: dto.floors ?? 0
        });
    }
    async findAll(tenantId, page = 1, limit = 20, search, status, type) {
        const filter = { tenantId };
        if (status)
            filter.status = status;
        if (type)
            filter.type = type;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { propertyCode: { $regex: search, $options: 'i' } },
            ];
        }
        return this.propertyRepository.findPaginated({ page, limit, filter });
    }
    async findById(id, tenantId) {
        const property = await this.propertyRepository.findById(id);
        if (!property || property.isDeleted || property.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Property not found');
        }
        return property;
    }
    async update(id, tenantId, dto) {
        await this.findById(id, tenantId);
        const updateData = {
            ...dto,
            floors: dto.floors ?? 0
        };
        const property = await this.propertyRepository.update(id, updateData);
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        return property;
    }
    async remove(id, tenantId) {
        await this.findById(id, tenantId);
        return this.propertyRepository.delete(id);
    }
    async getStats(tenantId) {
        const [total, active, inactive, maintenance] = await Promise.all([
            this.propertyRepository.countByTenant(tenantId),
            this.propertyRepository.countByStatus(tenantId, 'active'),
            this.propertyRepository.countByStatus(tenantId, 'inactive'),
            this.propertyRepository.countByStatus(tenantId, 'maintenance'),
        ]);
        return { total, active, inactive, maintenance };
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [property_repository_1.PropertyRepository])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map