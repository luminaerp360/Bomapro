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
<<<<<<< HEAD
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
=======
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitsService = void 0;
const common_1 = require("@nestjs/common");
const unit_repository_1 = require("./repositories/unit.repository");
<<<<<<< HEAD
const property_repository_1 = require("../properties/repositories/property.repository");
let UnitsService = class UnitsService {
    constructor(unitRepository, propertyRepository) {
        this.unitRepository = unitRepository;
        this.propertyRepository = propertyRepository;
=======
let UnitsService = class UnitsService {
    constructor(unitRepository) {
        this.unitRepository = unitRepository;
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
    }
    async create(dto, tenantId) {
        return this.unitRepository.create({
            ...dto,
            tenantId,
            currentTenantId: '',
            currentLeaseId: '',
            currentPropertyTenantId: '',
        });
    }
    async findAll(tenantId, page = 1, limit = 20, propertyId, status, search, unitType, floor) {
        const filter = { tenantId };
        if (propertyId)
            filter.propertyId = propertyId;
        if (status)
            filter.status = status;
        if (unitType)
            filter.unitType = unitType;
        if (floor !== undefined && floor !== null && floor !== '') {
            if (floor === 'G' || floor === '0') {
                filter.floor = { $in: ['G', 0, '0', 'g'] };
            }
            else {
                const floorNum = parseInt(floor, 10);
                if (!isNaN(floorNum)) {
                    filter.floor = { $in: [floor, floorNum, String(floorNum)] };
                }
                else {
                    filter.floor = floor;
                }
            }
        }
        if (search) {
            filter.$or = [
                { unitNumber: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        return this.unitRepository.findPaginated({ page, limit, filter });
    }
    async findById(id, tenantId) {
        const unit = await this.unitRepository.findById(id);
        if (!unit || unit.isDeleted || unit.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Unit not found');
        }
        return unit;
    }
    async findByProperty(propertyId, tenantId) {
        return this.unitRepository.findByProperty(propertyId, tenantId);
    }
    async update(id, tenantId, dto) {
        await this.findById(id, tenantId);
        const unit = await this.unitRepository.update(id, dto);
        if (!unit)
            throw new common_1.NotFoundException('Unit not found');
        return unit;
    }
    async remove(id, tenantId) {
        await this.findById(id, tenantId);
        return this.unitRepository.delete(id);
    }
<<<<<<< HEAD
    async getStats(tenantId, propertyId) {
        return this.unitRepository.getUnitStats(tenantId, propertyId);
=======
    async getStats(tenantId) {
        const [total, occupied, available] = await Promise.all([
            this.unitRepository.countByTenant(tenantId),
            this.unitRepository.countOccupied(tenantId),
            this.unitRepository.countAvailable(tenantId),
        ]);
        return { total, occupied, available };
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
    }
    async assignTenant(unitId, tenantId, propertyTenantId, leaseId) {
        const unit = await this.findById(unitId, tenantId);
        return this.unitRepository.update(unitId, {
            currentTenantId: propertyTenantId,
            currentLeaseId: leaseId,
            currentPropertyTenantId: propertyTenantId,
            status: 'occupied',
        });
    }
    async releaseTenant(unitId, tenantId) {
        const unit = await this.findById(unitId, tenantId);
        return this.unitRepository.update(unitId, {
            currentTenantId: '',
            currentLeaseId: '',
            currentPropertyTenantId: '',
            status: 'vacant',
        });
    }
    async updateStatus(unitId, tenantId, status) {
        const unit = await this.findById(unitId, tenantId);
        return this.unitRepository.update(unitId, { status });
    }
    async findByPropertyTenant(propertyTenantId, tenantId) {
        return this.unitRepository.findByPropertyTenant(propertyTenantId, tenantId);
    }
    async findAvailableByProperty(propertyId, tenantId) {
        return this.unitRepository.findAvailable(propertyId, tenantId);
    }
<<<<<<< HEAD
    async bulkImport(dto, tenantId) {
        let items = [];
        if (Array.isArray(dto.units) && dto.units.length > 0) {
            items = dto.units.map((u) => ({
                property: (u.property || u.propertyName || '').trim(),
                unit: (u.unit || u.unitNumber || u.name || '').trim(),
                rentAmount: typeof u.rentAmount === 'number' && !isNaN(u.rentAmount) ? u.rentAmount : Number(u.rentAmount || 0),
            }));
        }
        else if (dto.csvText) {
            items = this.parseCsvText(dto.csvText);
        }
        items = items.filter((item) => {
            if (!item.property || !item.unit)
                return false;
            const lowerProp = item.property.toLowerCase();
            const lowerUnit = item.unit.toLowerCase();
            if (lowerProp === 'total' || lowerUnit === 'total')
                return false;
            if (lowerProp.startsWith('total ') || lowerUnit.startsWith('total '))
                return false;
            return true;
        });
        if (items.length === 0) {
            return {
                success: true,
                message: 'No valid unit records found to import.',
                total: 0,
                created: 0,
                updated: 0,
                skipped: 0,
                propertiesAffected: [],
            };
        }
        const grouped = new Map();
        for (const item of items) {
            const propKey = item.property.trim();
            if (!grouped.has(propKey)) {
                grouped.set(propKey, []);
            }
            grouped.get(propKey).push({ unit: item.unit.trim(), rentAmount: item.rentAmount });
        }
        let createdCount = 0;
        let updatedCount = 0;
        const propertiesAffected = [];
        for (const [propertyName, unitRows] of grouped.entries()) {
            propertiesAffected.push(propertyName);
            let property = await this.propertyRepository.findOne({
                name: { $regex: new RegExp(`^${propertyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                tenantId,
            });
            if (!property) {
                let propertyCode = '';
                let codeExists = true;
                let attempts = 0;
                while (codeExists && attempts < 15) {
                    attempts++;
                    const rand = Math.floor(1000 + Math.random() * 9000);
                    propertyCode = `PROP-${Date.now().toString().slice(-4)}${rand}`;
                    const found = await this.propertyRepository.findOne({ propertyCode });
                    if (!found)
                        codeExists = false;
                }
                property = await this.propertyRepository.create({
                    name: propertyName,
                    address: propertyName,
                    propertyCode,
                    type: 'apartment',
                    status: 'active',
                    tenantId,
                    floors: 0,
                });
            }
            const propertyId = property._id.toString();
            const existingUnits = await this.unitRepository.findByProperty(propertyId, tenantId);
            const existingUnitsMap = new Map();
            for (const u of existingUnits) {
                existingUnitsMap.set(u.unitNumber.toLowerCase().trim(), u);
            }
            for (const row of unitRows) {
                const key = row.unit.toLowerCase().trim();
                const existing = existingUnitsMap.get(key);
                if (existing) {
                    await this.unitRepository.update(existing._id.toString(), {
                        rentAmount: row.rentAmount,
                        currency: 'KES',
                    });
                    updatedCount++;
                }
                else {
                    const newUnit = await this.unitRepository.create({
                        tenantId,
                        propertyId,
                        unitNumber: row.unit,
                        rentAmount: row.rentAmount,
                        currency: 'KES',
                        status: 'vacant',
                        unitType: 'one_bedroom',
                        floor: 0,
                        rentCycle: 'monthly',
                        currentTenantId: '',
                        currentLeaseId: '',
                        currentPropertyTenantId: '',
                    });
                    existingUnitsMap.set(key, newUnit);
                    createdCount++;
                }
            }
        }
        return {
            success: true,
            message: `Successfully processed ${items.length} units (${createdCount} created, ${updatedCount} updated).`,
            total: items.length,
            created: createdCount,
            updated: updatedCount,
            skipped: 0,
            propertiesAffected,
        };
    }
    parseCsvText(csvText) {
        const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length === 0)
            return [];
        let propertyIdx = 0;
        let unitIdx = 1;
        let rentIdx = 2;
        const firstLine = lines[0];
        const headerCols = this.parseCsvLine(firstLine).map((c) => c.toLowerCase().trim());
        const isHeader = headerCols.some((c) => c.includes('prop') || c.includes('unit') || c.includes('rent') || c.includes('house'));
        let startLine = 0;
        if (isHeader) {
            startLine = 1;
            headerCols.forEach((col, idx) => {
                if (col.includes('prop'))
                    propertyIdx = idx;
                else if (col.includes('unit') || col.includes('house') || col.includes('door') || col.includes('room'))
                    unitIdx = idx;
                else if (col.includes('rent') || col.includes('kes') || col.includes('amount') || col.includes('price'))
                    rentIdx = idx;
            });
        }
        const results = [];
        for (let i = startLine; i < lines.length; i++) {
            const cols = this.parseCsvLine(lines[i]);
            if (cols.length === 0)
                continue;
            const propName = (cols[propertyIdx] || '').trim();
            const unitName = (cols[unitIdx] || '').trim();
            const rawRent = (cols[rentIdx] || '').replace(/[^\d.-]/g, '').trim();
            const rentAmount = rawRent ? parseFloat(rawRent) : 0;
            if (propName && unitName) {
                results.push({
                    property: propName,
                    unit: unitName,
                    rentAmount: isNaN(rentAmount) ? 0 : rentAmount,
                });
            }
        }
        return results;
    }
    parseCsvLine(line) {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            }
            else {
                cur += char;
            }
        }
        result.push(cur.trim());
        return result;
    }
=======
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
};
exports.UnitsService = UnitsService;
exports.UnitsService = UnitsService = __decorate([
    (0, common_1.Injectable)(),
<<<<<<< HEAD
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => property_repository_1.PropertyRepository))),
    __metadata("design:paramtypes", [unit_repository_1.UnitRepository,
        property_repository_1.PropertyRepository])
=======
    __metadata("design:paramtypes", [unit_repository_1.UnitRepository])
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
], UnitsService);
//# sourceMappingURL=units.service.js.map