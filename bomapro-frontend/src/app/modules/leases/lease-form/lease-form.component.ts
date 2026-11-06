import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Lease, PropertyTenant } from '../../../shared/interfaces/models';
import { LeasesService } from '../../../shared/services/leases/leases.service';
import { UnitsService } from '../../../shared/services/units/units.service';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-lease-form',
  templateUrl: './lease-form.component.html',
  styleUrls: ['./lease-form.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('200ms ease-out', style({ opacity: 1 }))])]),
    trigger('slideDown', [transition(':enter', [style({ transform: 'translateY(-16px)', opacity: 0 }), animate('220ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))])]),
  ],
})
export class LeaseFormComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() lease: Lease | null = null;
  @Input() preselectedUnit: any = null;
  @Input() preselectedTenant: PropertyTenant | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Lease>();

  form: Partial<Lease> = this.initializeForm();
  selectedDurationMonths = 12;
  durationOptions = [
    { label: '1 Year', months: 12 },
    { label: '2 Years', months: 24 },
    { label: '3 Years', months: 36 },
  ];
  properties: any[] = [];
  units: any[] = [];
  availableUnits: any[] = [];
  tenants: PropertyTenant[] = [];
  filteredTenants: PropertyTenant[] = [];
  showTenantDropdown = false;
  showCreateTenant = false;
  tenantSearchQuery = '';
  loading = false;
  submitted = false;
  errorMessage = '';
  tenantWithActiveLeaseError = false;
  newTenantForm = {
    name: '',
    idNumber: '',
    phone: '',
    email: '',
  };
  newTenantLoading = false;

  paymentFrequencyOptions = ['monthly', 'quarterly', 'semi_annually', 'annually'];
  statuses = ['draft', 'active', 'expired', 'terminated', 'renewed'];

  constructor(
    private leasesService: LeasesService,
    private unitsService: UnitsService,
    private propertiesService: PropertiesService,
    private propertyTenantsService: PropertyTenantsService,
    public themeService: ThemeService,
  ) {}

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showCreateTenant) {
      this.cancelCreateTenant();
    } else if (this.showTenantDropdown) {
      this.showTenantDropdown = false;
    } else if (this.isOpen) {
      this.closeModal();
    }
  }

  ngOnInit(): void {
    this.loadProperties();
    this.loadTenants();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.errorMessage = '';
      this.submitted = false;
      this.tenantWithActiveLeaseError = false;
      this.showTenantDropdown = false;
      this.selectedDurationMonths = 12;

      if (this.lease) {
        this.form = {
          ...this.lease,
          startDate: this.formatDateForInput(this.lease.startDate),
          endDate: this.formatDateForInput(this.lease.endDate),
        };
        this.tenantSearchQuery =
          this.getTenantDisplayName(this.form.propertyTenantId || '') ||
          this.lease.propertyTenantName ||
          '';
        if (this.form.propertyId) {
          this.loadUnitsForProperty(this.form.propertyId, this.lease.unitId);
        }
      } else {
        this.form = this.initializeForm();
        this.tenantSearchQuery = '';
        this.availableUnits = [];

        if (this.preselectedTenant) {
          this.selectTenant(this.preselectedTenant);
        }

        if (this.preselectedUnit) {
          this.form.propertyId = this.preselectedUnit.propertyId || '';
          this.form.propertyName = this.preselectedUnit.propertyName || '';
          this.form.unitId = this.preselectedUnit._id || '';
          this.form.unitNumber = this.preselectedUnit.unitNumber || '';
          this.form.rentAmount = this.preselectedUnit.rentAmount || 0;
          this.form.depositAmount = this.preselectedUnit.securityDeposit || this.preselectedUnit.rentAmount || 0;
          this.form.currency = this.preselectedUnit.currency || 'KES';
          if (this.form.propertyId) {
            this.loadUnitsForProperty(this.form.propertyId, this.preselectedUnit._id);
          }
        }
      }
    }
  }

  private formatDateForInput(dateVal?: string | Date): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }

  private computeMonthsLater(startDateStr: string, months: number): string {
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) return '';
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  }

  initializeForm(): Partial<Lease> {
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      propertyId: '',
      unitId: '',
      propertyTenantId: '',
      tenantId: '',
      status: 'active',
      startDate: todayStr,
      endDate: this.computeMonthsLater(todayStr, 12),
      rentAmount: 0,
      depositAmount: 0,
      currency: 'KES',
      paymentFrequency: 'monthly',
      paymentDueDay: 5,
      lateFeeAmount: 0,
      gracePeriodDays: 5,
      terms: '',
      notes: '',
    };
  }

  setDuration(months: number): void {
    this.selectedDurationMonths = months;
    const startStr = this.form.startDate || new Date().toISOString().split('T')[0];
    this.form.endDate = this.computeMonthsLater(startStr, months);
  }

  onStartDateChange(): void {
    if (this.form.startDate) {
      this.form.endDate = this.computeMonthsLater(this.form.startDate, this.selectedDurationMonths || 12);
    }
  }

  loadProperties(): void {
    this.propertiesService.getAll(1, 100).subscribe({
      next: (res) => (this.properties = res.data || []),
      error: (err) => console.error('Error loading properties:', err),
    });
  }

  loadTenants(): void {
    this.propertyTenantsService.getAll(1, 1000).subscribe({
      next: (res) => {
        this.tenants = res.data || [];
        this.filteredTenants = this.tenants;
        if (this.lease && this.form.propertyTenantId) {
          this.tenantSearchQuery =
            this.getTenantDisplayName(this.form.propertyTenantId) ||
            this.lease.propertyTenantName ||
            '';
        }
      },
      error: (err) => console.error('Error loading tenants:', err),
    });
  }

  onPropertyChange(): void {
    this.form.unitId = '';
    if (!this.form.propertyId) {
      this.units = [];
      this.availableUnits = [];
      return;
    }
    const prop = this.properties.find((p) => p._id === this.form.propertyId);
    if (prop) {
      this.form.propertyName = prop.name;
    }
    this.loadUnitsForProperty(this.form.propertyId, this.lease?.unitId);
  }

  private loadUnitsForProperty(propertyId: string, includeUnitId?: string): void {
    this.unitsService.findAvailableByProperty(propertyId).subscribe({
      next: (units) => {
        const list = [...(units || [])];
        if (includeUnitId && !list.some((u) => u._id === includeUnitId)) {
          this.unitsService.getById(includeUnitId).subscribe({
            next: (currentUnit) => {
              if (currentUnit && !list.some((u) => u._id === currentUnit._id)) {
                this.availableUnits = [currentUnit, ...list];
              } else {
                this.availableUnits = list;
              }
            },
            error: () => {
              this.availableUnits = list;
            },
          });
        } else {
          this.availableUnits = list;
        }
      },
      error: (err) => console.error('Error loading units:', err),
    });
  }

  searchTenants(query: string): void {
    this.tenantSearchQuery = query;
    this.showTenantDropdown = true;
    if (!query.trim()) {
      this.filteredTenants = this.tenants;
      return;
    }

    const lowerQuery = query.toLowerCase();
    this.filteredTenants = this.tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        (t.phone && t.phone.includes(query)) ||
        (t.idNumber && t.idNumber.includes(query)),
    );
  }

  selectTenant(tenant: PropertyTenant): void {
    this.form.propertyTenantId = tenant._id;
    this.form.propertyTenantName = tenant.name;
    this.tenantSearchQuery = `${tenant.name} (${tenant.phone})`;
    this.showTenantDropdown = false;
    this.tenantWithActiveLeaseError = false;

    if (
      tenant.currentLeaseId &&
      (!this.lease || tenant.currentLeaseId !== this.lease._id)
    ) {
      this.tenantWithActiveLeaseError = true;
    }
  }

  getTenantDisplayName(tenantId: string): string {
    const tenant = this.tenants.find((t) => t._id === tenantId);
    return tenant ? `${tenant.name} (${tenant.phone})` : '';
  }

  onUnitChange(): void {
    if (!this.form.unitId) return;

    const selectedUnit = this.availableUnits.find((u) => u._id === this.form.unitId);
    if (selectedUnit) {
      this.form.rentAmount = selectedUnit.rentAmount;
      this.form.depositAmount = selectedUnit.securityDeposit || selectedUnit.rentAmount || 0;
      this.form.currency = selectedUnit.currency || 'KES';
      this.form.unitNumber = selectedUnit.unitNumber;
      if (selectedUnit.propertyId) {
        this.form.propertyId = selectedUnit.propertyId;
      }
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.form.propertyId || !this.form.unitId || !this.form.propertyTenantId || !this.form.startDate) {
      return;
    }

    if (this.tenantWithActiveLeaseError) {
      this.errorMessage = 'Selected tenant already has an active lease. Terminate their existing lease first.';
      return;
    }

    const prop = this.properties.find((p) => p._id === this.form.propertyId);
    if (prop) this.form.propertyName = prop.name;

    const unit = this.availableUnits.find((u) => u._id === this.form.unitId);
    if (unit) this.form.unitNumber = unit.unitNumber;

    const tenant = this.tenants.find((t) => t._id === this.form.propertyTenantId);
    if (tenant) this.form.propertyTenantName = tenant.name;

    this.loading = true;

    const request$ = this.lease
      ? this.leasesService.update(this.lease._id || '', this.form as any)
      : this.leasesService.create(this.form as any);

    request$.subscribe({
      next: (result) => {
        this.save.emit(result);
        this.loading = false;
        this.closeModal();
      },
      error: (err) => {
        console.error('Error saving lease:', err);
        this.errorMessage = err?.error?.message || 'Failed to save lease. Please check all fields and try again.';
        this.loading = false;
      },
    });
  }

  closeModal(): void {
    this.showTenantDropdown = false;
    this.close.emit();
  }

  openCreateTenant(): void {
    this.showCreateTenant = true;
    this.showTenantDropdown = false;
    this.newTenantForm = {
      name: '',
      idNumber: '',
      phone: '',
      email: '',
    };
  }

  cancelCreateTenant(): void {
    this.showCreateTenant = false;
    this.newTenantForm = {
      name: '',
      idNumber: '',
      phone: '',
      email: '',
    };
  }

  submitNewTenant(): void {
    if (!this.newTenantForm.name || !this.newTenantForm.phone) {
      return;
    }

    this.newTenantLoading = true;
    const payload: any = {
      name: this.newTenantForm.name.trim(),
      phone: this.newTenantForm.phone.trim(),
    };
    if (this.newTenantForm.idNumber?.trim()) payload.idNumber = this.newTenantForm.idNumber.trim();
    if (this.newTenantForm.email?.trim()) payload.email = this.newTenantForm.email.trim();

    this.propertyTenantsService.create(payload).subscribe({
      next: (newTenant) => {
        this.tenants.push(newTenant);
        this.filteredTenants = this.tenants;
        this.selectTenant(newTenant);
        this.showCreateTenant = false;
        this.newTenantLoading = false;
      },
      error: (err) => {
        console.error('Error creating tenant:', err);
        this.newTenantLoading = false;
      },
    });
  }
}
