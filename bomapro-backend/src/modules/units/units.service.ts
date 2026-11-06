import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UnitRepository } from './repositories/unit.repository';
import { CreateUnitDto, UpdateUnitDto, BulkImportUnitsDto } from './dto/unit.dto';
import { PropertyRepository } from '../properties/repositories/property.repository';
import { PropertyTenant } from '../property-tenants/schemas/property-tenant.schema';
import { Lease } from '../leases/schemas/lease.schema';
import { Property } from '../properties/schemas/property.schema';

@Injectable()
export class UnitsService {
  constructor(
    private readonly unitRepository: UnitRepository,
    @Inject(forwardRef(() => PropertyRepository))
    private readonly propertyRepository: PropertyRepository,
    @InjectModel(PropertyTenant.name) private readonly propertyTenantModel: Model<PropertyTenant>,
    @InjectModel(Lease.name) private readonly leaseModel: Model<Lease>,
    @InjectModel(Property.name) private readonly propertyModel: Model<Property>,
  ) {}

  async create(dto: CreateUnitDto, tenantId: string) {
    return this.unitRepository.create({
      ...dto,
      status: dto.status || 'vacant',
      tenantId,
      currentTenantId: '',
      currentLeaseId: '',
      currentPropertyTenantId: '',
    } as any);
  }

  private async enrichUnits(rawUnits: any[]): Promise<any[]> {
    if (!rawUnits || !rawUnits.length) return [];

    const plainUnits = rawUnits.map((u: any) => (u?.toObject ? u.toObject() : { ...u }));
    const unitIds = plainUnits.map((u: any) => String(u._id));
    const propertyIds = Array.from(
      new Set(plainUnits.map((u: any) => u.propertyId && String(u.propertyId).trim()).filter(Boolean)),
    );
    const tenantIds = new Set<string>();
    for (const u of plainUnits) {
      if (u.currentTenantId && String(u.currentTenantId).trim()) tenantIds.add(String(u.currentTenantId).trim());
      if (u.currentPropertyTenantId && String(u.currentPropertyTenantId).trim()) {
        tenantIds.add(String(u.currentPropertyTenantId).trim());
      }
    }

    const [properties, activeLeases] = await Promise.all([
      propertyIds.length
        ? this.propertyModel.find({ _id: { $in: propertyIds } }).lean().exec()
        : Promise.resolve([]),
      this.leaseModel
        .find({ unitId: { $in: unitIds }, status: 'active', isDeleted: false })
        .lean()
        .exec(),
    ]);

    for (const l of activeLeases as any[]) {
      if (l.propertyTenantId && String(l.propertyTenantId).trim()) {
        tenantIds.add(String(l.propertyTenantId).trim());
      }
    }

    const tenants = tenantIds.size
      ? await this.propertyTenantModel.find({ _id: { $in: Array.from(tenantIds) } }).lean().exec()
      : [];

    const propertyMap = new Map<string, any>(properties.map((p: any) => [String(p._id), p]));
    const tenantMap = new Map<string, any>(tenants.map((t: any) => [String(t._id), t]));
    const leaseByUnitMap = new Map<string, any>();
    for (const l of activeLeases as any[]) {
      leaseByUnitMap.set(String(l.unitId), l);
    }

    return plainUnits.map((unit: any) => {
      if (unit.propertyId) {
        const prop = propertyMap.get(String(unit.propertyId));
        if (prop) unit.propertyName = prop.name;
      }

      const activeLease = leaseByUnitMap.get(String(unit._id));
      if (activeLease) {
        unit.currentLeaseId = String(activeLease._id);
        unit.leaseNumber = activeLease.leaseNumber;
        unit.leaseStartDate = activeLease.startDate;
        unit.leaseEndDate = activeLease.endDate;
        unit.leaseStatus = activeLease.status;
        if (!unit.currentTenantId && activeLease.propertyTenantId) {
          unit.currentTenantId = String(activeLease.propertyTenantId);
        }
        if (activeLease.propertyTenantName && !unit.currentTenantName) {
          unit.currentTenantName = activeLease.propertyTenantName;
        }
      }

      const occTenantId = unit.currentTenantId || unit.currentPropertyTenantId;
      if (occTenantId) {
        const t = tenantMap.get(String(occTenantId));
        if (t) {
          unit.currentTenantName = t.name;
          unit.currentTenantPhone = t.phone;
        }
      }

      return unit;
    });
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
    propertyId?: string,
    status?: string,
    search?: string,
    unitType?: string,
    floor?: string,
  ) {
    const filter: any = { tenantId };
    if (propertyId) filter.propertyId = propertyId;
    if (status) filter.status = status;
    if (unitType) filter.unitType = unitType;

    if (floor !== undefined && floor !== null && floor !== '') {
      if (floor === 'G' || floor === '0') {
        filter.floor = { $in: ['G', 0, '0', 'g'] };
      } else {
        const floorNum = parseInt(floor, 10);
        if (!isNaN(floorNum)) {
          filter.floor = { $in: [floor, floorNum, String(floorNum)] };
        } else {
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
    const result = await this.unitRepository.findPaginated({ page, limit, filter });
    const enrichedData = await this.enrichUnits(result.data);
    return {
      ...result,
      data: enrichedData,
    };
  }

  async findById(id: string, tenantId: string) {
    const unit = await this.unitRepository.findById(id);
    if (!unit || unit.isDeleted || unit.tenantId !== tenantId) {
      throw new NotFoundException('Unit not found');
    }
    const [enriched] = await this.enrichUnits([unit]);
    return enriched || unit;
  }

  async findByProperty(propertyId: string, tenantId: string) {
    const units = await this.unitRepository.findByProperty(propertyId, tenantId);
    return this.enrichUnits(units);
  }

  async update(id: string, tenantId: string, dto: UpdateUnitDto) {
    await this.findById(id, tenantId);
    const unit = await this.unitRepository.update(id, dto as any);
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async remove(id: string, tenantId: string) {
    const unit = await this.findById(id, tenantId);
    // Clean up any active leases or tenant links referencing this unit
    await this.leaseModel.updateMany(
      { unitId: String(id), status: { $in: ['active', 'draft'] }, isDeleted: false },
      { $set: { status: 'terminated', terminatedAt: new Date(), terminationReason: 'Unit deleted' } },
    );
    if (unit.currentTenantId) {
      await this.propertyTenantModel.findByIdAndUpdate(unit.currentTenantId, {
        currentLeaseId: '',
        currentPropertyId: '',
      });
    }
    return this.unitRepository.delete(id);
  }

  async getStats(tenantId: string, propertyId?: string) {
    return this.unitRepository.getUnitStats(tenantId, propertyId);
  }

  async assignTenant(unitId: string, tenantId: string, propertyTenantId: string, leaseId: string) {
    await this.findById(unitId, tenantId);
    return this.unitRepository.update(unitId, {
      currentTenantId: propertyTenantId,
      currentLeaseId: leaseId,
      currentPropertyTenantId: propertyTenantId,
      status: 'occupied',
    } as any);
  }

  async releaseTenant(unitId: string, tenantId: string) {
    await this.findById(unitId, tenantId);
    return this.unitRepository.update(unitId, {
      currentTenantId: '',
      currentLeaseId: '',
      currentPropertyTenantId: '',
      status: 'vacant',
    } as any);
  }

  async updateStatus(unitId: string, tenantId: string, status: string) {
    await this.findById(unitId, tenantId);
    return this.unitRepository.update(unitId, { status } as any);
  }

  async findByPropertyTenant(propertyTenantId: string, tenantId: string) {
    return this.unitRepository.findByPropertyTenant(propertyTenantId, tenantId);
  }

  async findAvailableByProperty(propertyId: string, tenantId: string) {
    return this.unitRepository.findAvailable(propertyId, tenantId);
  }

  async bulkImport(dto: BulkImportUnitsDto, tenantId: string) {
    let items: Array<{ property: string; unit: string; rentAmount: number }> = [];

    if (Array.isArray(dto.units) && dto.units.length > 0) {
      items = dto.units.map((u: any) => ({
        property: (u.property || u.propertyName || '').trim(),
        unit: (u.unit || u.unitNumber || u.name || '').trim(),
        rentAmount: typeof u.rentAmount === 'number' && !isNaN(u.rentAmount) ? u.rentAmount : Number(u.rentAmount || 0),
      }));
    } else if (dto.csvText) {
      items = this.parseCsvText(dto.csvText);
    }

    items = items.filter((item) => {
      if (!item.property || !item.unit) return false;
      const lowerProp = item.property.toLowerCase();
      const lowerUnit = item.unit.toLowerCase();
      if (lowerProp === 'total' || lowerUnit === 'total') return false;
      if (lowerProp.startsWith('total ') || lowerUnit.startsWith('total ')) return false;
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

    const grouped = new Map<string, Array<{ unit: string; rentAmount: number }>>();
    for (const item of items) {
      const propKey = item.property.trim();
      if (!grouped.has(propKey)) {
        grouped.set(propKey, []);
      }
      grouped.get(propKey)!.push({ unit: item.unit.trim(), rentAmount: item.rentAmount });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const propertiesAffected: string[] = [];

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
          if (!found) codeExists = false;
        }

        property = await this.propertyRepository.create({
          name: propertyName,
          address: propertyName,
          propertyCode,
          type: 'apartment',
          status: 'active',
          tenantId,
          floors: 0,
        } as any);
      }

      const propertyId = property._id.toString();

      const existingUnits = await this.unitRepository.findByProperty(propertyId, tenantId);
      const existingUnitsMap = new Map<string, any>();
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
          } as any);
          updatedCount++;
        } else {
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
          } as any);
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

  private parseCsvText(csvText: string): Array<{ property: string; unit: string; rentAmount: number }> {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return [];

    let propertyIdx = 0;
    let unitIdx = 1;
    let rentIdx = 2;

    const firstLine = lines[0];
    const headerCols = this.parseCsvLine(firstLine).map((c) => c.toLowerCase().trim());

    const isHeader = headerCols.some(
      (c) => c.includes('prop') || c.includes('unit') || c.includes('rent') || c.includes('house'),
    );

    let startLine = 0;
    if (isHeader) {
      startLine = 1;
      headerCols.forEach((col, idx) => {
        if (col.includes('prop')) propertyIdx = idx;
        else if (col.includes('unit') || col.includes('house') || col.includes('door') || col.includes('room'))
          unitIdx = idx;
        else if (col.includes('rent') || col.includes('kes') || col.includes('amount') || col.includes('price'))
          rentIdx = idx;
      });
    }

    const results: Array<{ property: string; unit: string; rentAmount: number }> = [];

    for (let i = startLine; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      if (cols.length === 0) continue;

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

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  }
}
