import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeaseRepository } from './repositories/lease.repository';
import { CreateLeaseDto, UpdateLeaseDto } from './dto/lease.dto';
import { UnitsService } from '../units/units.service';
import { PropertyTenantsService } from '../property-tenants/property-tenants.service';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';
import { Property } from '../properties/schemas/property.schema';

@Injectable()
export class LeasesService {
  constructor(
    private readonly leaseRepository: LeaseRepository,
    private readonly unitsService: UnitsService,
    private readonly propertyTenantsService: PropertyTenantsService,
    private readonly rentSchedulesService: RentSchedulesService,
    @InjectModel(Property.name) private readonly propertyModel: Model<Property>,
  ) {}

  async create(dto: CreateLeaseDto, tenantId: string) {
    let unitDoc: any = null;
    // Validate unit exists and is available
    if (dto.unitId) {
      const activeLease = await this.leaseRepository.findActiveByUnit(dto.unitId, tenantId);
      if (activeLease) {
        throw new BadRequestException('This unit already has an active lease');
      }
      try {
        unitDoc = await this.unitsService.findById(dto.unitId, tenantId);
      } catch {}
    }

    let propertyTenantDoc: any = null;
    // Validate property tenant exists and doesn't have active lease
    if (dto.propertyTenantId) {
      try {
        propertyTenantDoc = await this.propertyTenantsService.findById(dto.propertyTenantId, tenantId);
        if (!propertyTenantDoc) {
          throw new BadRequestException('Property tenant not found');
        }
        if (propertyTenantDoc.currentLeaseId) {
          const existingActive = await this.leaseRepository.findById(propertyTenantDoc.currentLeaseId);
          if (existingActive && !existingActive.isDeleted && existingActive.status === 'active') {
            throw new BadRequestException(
              'This tenant already has an active lease. Please terminate the existing lease first.',
            );
          }
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Unable to validate property tenant');
      }
    }

    let propertyName = dto.propertyName || '';
    if (!propertyName && dto.propertyId) {
      try {
        const prop = await this.propertyModel.findById(dto.propertyId).lean().exec();
        if (prop) propertyName = (prop as any).name || '';
      } catch {}
    }

    const propertyTenantName = dto.propertyTenantName || propertyTenantDoc?.name || '';
    const unitNumber = unitDoc?.unitNumber || '';

    const startDate = new Date(dto.startDate);
    let endDate: Date;
    if (dto.endDate && String(dto.endDate).trim()) {
      endDate = new Date(dto.endDate);
    } else {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Generate sequential lease number: LS-0001, LS-0002, etc.
    const leaseNumber = (dto as any).leaseNumber || (await this.generateLeaseNumber(tenantId));
    const status = (dto as any).status || 'active';

    const createdLease = await this.leaseRepository.create({
      ...dto,
      tenantId,
      leaseNumber,
      startDate,
      endDate,
      propertyName,
      propertyTenantName,
      unitNumber,
      status,
      scheduleGenerated: false,
    } as any);

    if (status === 'active') {
      // Update PropertyTenant with currentLeaseId and currentPropertyId
      if (dto.propertyTenantId && createdLease._id) {
        try {
          await this.propertyTenantsService.update(dto.propertyTenantId, tenantId, {
            currentLeaseId: createdLease._id.toString(),
            currentPropertyId: dto.propertyId || '',
          });
        } catch (error) {
          console.error('Failed to update PropertyTenant lease info:', error.message);
        }
      }

      // Update unit status to "occupied" if lease is active
      if (dto.unitId && createdLease._id) {
        try {
          await this.unitsService.assignTenant(
            dto.unitId,
            tenantId,
            dto.propertyTenantId,
            createdLease._id.toString(),
          );
        } catch (error) {
          console.error('Failed to update unit occupancy during lease creation:', error.message);
        }
      }
    }

    // Generate 12-month rent schedule automatically
    if (createdLease._id && dto.rentAmount > 0) {
      try {
        await this.rentSchedulesService.generateSchedulesForLease(
          createdLease._id.toString(),
          tenantId,
          dto.propertyId,
          dto.unitId,
          startDate,
          dto.rentAmount,
          dto.gracePeriodDays || 5,
          12,
        );

        await this.leaseRepository.update(createdLease._id.toString(), {
          scheduleGenerated: true,
          scheduleGeneratedAt: new Date(),
        } as any);
      } catch (error) {
        console.error('Failed to generate rent schedule:', error.message);
      }
    }

    return createdLease;
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string, status?: string) {
    const filter: any = { tenantId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { leaseNumber: { $regex: search, $options: 'i' } },
        { propertyName: { $regex: search, $options: 'i' } },
        { propertyTenantName: { $regex: search, $options: 'i' } },
      ];
    }
    return this.leaseRepository.findPaginated({ page, limit, filter });
  }

  async findById(id: string, tenantId: string) {
    const lease = await this.leaseRepository.findById(id);
    if (!lease || lease.isDeleted || lease.tenantId !== tenantId) {
      throw new NotFoundException('Lease not found');
    }
    return lease;
  }

  async findWithBalance(id: string, tenantId: string) {
    const lease = await this.findById(id, tenantId);
    const balance = await this.rentSchedulesService.getLeaseBalance(tenantId, id);
    const schedules = await this.rentSchedulesService.findByLease(tenantId, id);

    return {
      lease,
      balance,
      schedules,
    };
  }

  async findByProperty(tenantId: string, propertyId: string) {
    return this.leaseRepository.findByProperty(tenantId, propertyId);
  }

  async findByPropertyTenant(tenantId: string, propertyTenantId: string) {
    return this.leaseRepository.findByPropertyTenant(tenantId, propertyTenantId);
  }

  async findExpiringSoon(tenantId: string, days = 30) {
    return this.leaseRepository.findExpiringSoon(tenantId, days);
  }

  async findByUnit(tenantId: string, unitId: string) {
    return this.leaseRepository.findByUnit(tenantId, unitId);
  }

  async activate(id: string, tenantId: string) {
    const lease = await this.findById(id, tenantId);

    // Check if unit already has an active lease
    if (lease.unitId) {
      const activeLease = await this.leaseRepository.findActiveByUnit(lease.unitId, tenantId);
      if (activeLease && activeLease._id.toString() !== id) {
        throw new BadRequestException('This unit already has an active lease');
      }
    }

    const updated = await this.leaseRepository.update(id, { status: 'active' } as any);

    // If lease is for a unit, mark unit as occupied
    if (lease.unitId) {
      try {
        await this.unitsService.assignTenant(lease.unitId, tenantId, lease.propertyTenantId, id);
      } catch (error) {
        // Log error but don't fail the activation
        console.error('Failed to update unit occupancy:', error.message);
      }
    }

    return updated;
  }

  async terminate(id: string, tenantId: string, reason: string) {
    const lease = await this.findById(id, tenantId);
    const terminatedAt = new Date();

    const updated = await this.leaseRepository.update(id, {
      status: 'terminated',
      terminatedAt,
      terminationReason: reason || 'Terminated by management',
    } as any);

    await this.releaseUnitAndTenantForLease(lease, tenantId);

    // Cancel future unpaid rent schedules after termination date
    try {
      await this.rentSchedulesService.cancelFutureSchedulesForLease(tenantId, id, terminatedAt);
    } catch (error) {
      console.error('Failed to cancel future rent schedules on termination:', error.message);
    }

    return updated;
  }

  private async releaseUnitAndTenantForLease(lease: any, tenantId: string) {
    const leaseId = String(lease._id);
    if (lease.propertyTenantId) {
      try {
        const pt = await this.propertyTenantsService.findById(lease.propertyTenantId, tenantId);
        if (!pt.currentLeaseId || String(pt.currentLeaseId) === leaseId) {
          await this.propertyTenantsService.update(lease.propertyTenantId, tenantId, {
            currentLeaseId: '',
            currentPropertyId: '',
          });
        }
      } catch (error) {
        console.error('Failed to clear PropertyTenant lease info:', error.message);
      }
    }

    if (lease.unitId) {
      try {
        const unit = await this.unitsService.findById(lease.unitId, tenantId);
        if (
          !unit.currentLeaseId ||
          String(unit.currentLeaseId) === leaseId ||
          String(unit.currentTenantId) === String(lease.propertyTenantId) ||
          String(unit.currentPropertyTenantId) === String(lease.propertyTenantId)
        ) {
          await this.unitsService.releaseTenant(lease.unitId, tenantId);
        }
      } catch (error) {
        console.error('Failed to release unit occupancy:', error.message);
      }
    } else if (lease.propertyTenantId) {
      try {
        const u = await this.unitsService.findByPropertyTenant(lease.propertyTenantId, tenantId);
        if (u && (!u.currentLeaseId || String(u.currentLeaseId) === leaseId)) {
          await this.unitsService.releaseTenant(String(u._id), tenantId);
        }
      } catch (error) {
        console.error('Failed to release fallback unit occupancy:', error.message);
      }
    }
  }

  async update(id: string, tenantId: string, dto: UpdateLeaseDto) {
    const existing = await this.findById(id, tenantId);
    const updatePayload: any = { ...dto };

    if (dto.propertyId && !dto.propertyName) {
      try {
        const prop = await this.propertyModel.findById(dto.propertyId).lean().exec();
        if (prop) updatePayload.propertyName = (prop as any).name || '';
      } catch {}
    }

    if (dto.unitId) {
      try {
        const unit = await this.unitsService.findById(dto.unitId, tenantId);
        if (unit) updatePayload.unitNumber = unit.unitNumber || '';
      } catch {}
    }

    if (dto.propertyTenantId && !dto.propertyTenantName) {
      try {
        const pt = await this.propertyTenantsService.findById(dto.propertyTenantId, tenantId);
        if (pt) updatePayload.propertyTenantName = pt.name || '';
      } catch {}
    }

    // If status is changed to terminated or expired via update, release unit & tenant
    if (
      dto.status &&
      ['terminated', 'expired'].includes(dto.status) &&
      existing.status === 'active'
    ) {
      if (dto.status === 'terminated' && !(existing as any).terminatedAt) {
        updatePayload.terminatedAt = new Date();
      }
      await this.releaseUnitAndTenantForLease(existing, tenantId);
      await this.rentSchedulesService.cancelFutureSchedulesForLease(tenantId, id, new Date());
    } else if (dto.status === 'active' && existing.status !== 'active') {
      // Re-activating lease
      const targetUnitId = dto.unitId || existing.unitId;
      const targetTenantId = dto.propertyTenantId || existing.propertyTenantId;
      if (targetUnitId) {
        await this.unitsService.assignTenant(targetUnitId, tenantId, targetTenantId, id).catch(() => {});
      }
      if (targetTenantId) {
        await this.propertyTenantsService
          .update(targetTenantId, tenantId, {
            currentLeaseId: id,
            currentPropertyId: dto.propertyId || existing.propertyId || '',
          })
          .catch(() => {});
      }
    }

    const lease = await this.leaseRepository.update(id, updatePayload);
    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
  }

  async remove(id: string, tenantId: string) {
    const lease = await this.findById(id, tenantId);
    await this.releaseUnitAndTenantForLease(lease, tenantId);
    await this.rentSchedulesService.deleteSchedulesForLease(tenantId, id).catch(() => {});
    return this.leaseRepository.delete(id);
  }

  async signLease(id: string, propertyTenantId: string, tenantId: string) {
    const lease = await this.findById(id, tenantId);

    // Validate that the tenant signing is the one on the lease
    if (propertyTenantId && lease.propertyTenantId !== propertyTenantId) {
      throw new BadRequestException('You cannot sign this lease');
    }

    const updated = await this.leaseRepository.update(id, {
      isSigned: true,
      signedAt: new Date(),
      signedByPropertyTenantId: propertyTenantId || lease.propertyTenantId,
    } as any);

    return updated;
  }

  async getStats(tenantId: string) {
    const [total, active, expired, draft, terminated] = await Promise.all([
      this.leaseRepository.countByTenant(tenantId),
      this.leaseRepository.countByStatus(tenantId, 'active'),
      this.leaseRepository.countByStatus(tenantId, 'expired'),
      this.leaseRepository.countByStatus(tenantId, 'draft'),
      this.leaseRepository.countByStatus(tenantId, 'terminated'),
    ]);
    const expiringSoon = await this.leaseRepository.findExpiringSoon(tenantId, 30);
    return { total, active, expired, draft, terminated, expiringSoonCount: expiringSoon.length };
  }

  private async generateLeaseNumber(tenantId: string): Promise<string> {
    try {
      const leases = await this.leaseRepository.findByTenant(tenantId);
      let maxNumber = 0;
      for (const l of leases || []) {
        const match = l.leaseNumber?.match(/LS-(\d+)/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
      return `LS-${String(maxNumber + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating lease number:', error.message);
      return `LS-0001`;
    }
  }
}
