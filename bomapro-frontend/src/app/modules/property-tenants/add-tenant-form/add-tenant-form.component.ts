import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { UnitsService } from '../../../shared/services/units/units.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { PropertyFilterService } from '../../../shared/services/property-filter/property-filter.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { PropertyTenant } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-add-tenant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4" *ngIf="isOpen" (click)="onCancel()">
      <div (click)="$event.stopPropagation()" class="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Add New Tenant</h2>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Register a tenant and optionally assign a unit to automatically create a 1+ year lease
            </p>
          </div>
          <button type="button" (click)="onCancel()" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 text-xl leading-none">
            &times;
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="tenantForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <!-- Full Name (Compulsory) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Full Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g., John Kariuki"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition placeholder:text-gray-400"
              [style.--tw-ring-color]="themeService.accent"
              [class.border-red-500]="isFieldInvalid('name')"
            />
            <p *ngIf="isFieldInvalid('name')" class="text-xs text-red-500 mt-1">Full name is required</p>
          </div>

          <!-- Assign to Property & Unit + Auto-Create Lease (1+ Year) -->
          <div class="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <i class="fas fa-file-contract text-emerald-600 dark:text-emerald-400"></i>
                <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100">Assign Unit & Auto-Create Lease</h3>
              </div>
              <span class="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                1+ Year Lease Sync
              </span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Select a vacant unit to automatically create an active lease (minimum 1 year), mark the unit as occupied, and generate monthly rent schedules.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Property Selector -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Property
                </label>
                <select
                  formControlName="propertyId"
                  (change)="onPropertyChange($event)"
                  class="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                  [style.--tw-ring-color]="themeService.accent"
                >
                  <option value="">-- None / Assign Later --</option>
                  <option *ngFor="let p of properties" [value]="p._id">{{ p.name }}</option>
                </select>
              </div>

              <!-- Unit Selector -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Unit <span class="text-gray-400 font-normal">(Vacant Only)</span></span>
                  <span *ngIf="loadingUnits" class="text-xs text-emerald-600 dark:text-emerald-400"><i class="fas fa-spinner fa-spin"></i> Loading...</span>
                </label>
                <ng-select
                  [items]="units"
                  bindLabel="displayText"
                  bindValue="_id"
                  formControlName="unitId"
                  (change)="onUnitSelected($event)"
                  [placeholder]="selectedPropertyId ? (units.length === 0 && !loadingUnits ? 'No vacant units available' : 'Search & select vacant unit...') : 'Choose Property First'"
                  [searchable]="true"
                  [clearable]="true"
                  [disabled]="!selectedPropertyId || loadingUnits"
                  class="custom-ng-select"
                >
                </ng-select>
              </div>
            </div>

            <!-- Auto-Lease Terms Configuration (Shown when a unit is selected) -->
            <div *ngIf="tenantForm.get('unitId')?.value" class="pt-3 border-t border-emerald-200/80 dark:border-emerald-800/50 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  <i class="fas fa-calendar-check mr-1"></i> Lease Terms (Minimum 1 Year)
                </span>
                <div class="flex items-center gap-1">
                  <button
                    *ngFor="let dur of durationOptions"
                    type="button"
                    (click)="setLeaseDuration(dur.months)"
                    class="px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors"
                    [ngClass]="tenantForm.get('leaseDurationMonths')?.value === dur.months
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:bg-emerald-50'"
                  >
                    {{ dur.label }}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    formControlName="startDate"
                    (change)="onStartDateChange()"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-xs outline-none"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">End Date (Min 1 Yr)</label>
                  <input
                    type="date"
                    formControlName="endDate"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-xs outline-none"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Due Day of Month</label>
                  <input
                    type="number"
                    formControlName="paymentDueDay"
                    min="1"
                    max="28"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-xs outline-none"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Monthly Rent (KES)</label>
                  <input
                    type="number"
                    formControlName="rentAmount"
                    min="0"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-xs outline-none font-semibold"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Security Deposit (KES)</label>
                  <input
                    type="number"
                    formControlName="depositAmount"
                    min="0"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-xs outline-none font-semibold"
                  />
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-200/70 dark:border-slate-700 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <i class="fas fa-check-circle text-emerald-600 flex-shrink-0"></i>
                <span>
                  Will automatically create a <strong>{{ (tenantForm.get('leaseDurationMonths')?.value || 12) / 12 }}-Year Active Lease</strong>, mark unit <strong>Occupied</strong>, and generate <strong>{{ tenantForm.get('leaseDurationMonths')?.value || 12 }} monthly rent schedules</strong>.
                </span>
              </div>
            </div>
          </div>

          <!-- Phone Number (Compulsory) and Email (Optional) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phone Number <span class="text-red-500">*</span>
              </label>
              <input
                type="tel"
                formControlName="phone"
                placeholder="e.g. 0712345678"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition placeholder:text-gray-400"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('phone')"
              />
              <p *ngIf="isFieldInvalid('phone')" class="text-xs text-red-500 mt-1">{{ getPhoneError() }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email <span class="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                formControlName="email"
                placeholder="e.g. john@example.com"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition placeholder:text-gray-400"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('email')"
              />
              <p *ngIf="isFieldInvalid('email')" class="text-xs text-red-500 mt-1">Please enter a valid email address</p>
            </div>
          </div>

          <!-- ID Number and KRA PIN -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ID Number <span class="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                formControlName="idNumber"
                placeholder="e.g. 12345678"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                KRA PIN <span class="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                formControlName="kraPin"
                placeholder="e.g. A001234567U"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none"
              />
            </div>
          </div>

          <!-- Occupation and Employer -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Occupation <span class="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                formControlName="occupation"
                placeholder="e.g., Software Engineer"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Employer <span class="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                formControlName="employer"
                placeholder="e.g., Tech Company Ltd"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none"
              />
            </div>
          </div>

          <!-- Emergency Contact -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Emergency Contact <span class="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                formControlName="emergencyContactName"
                placeholder="e.g. Jane Kariuki"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Emergency Phone
              </label>
              <input
                type="tel"
                formControlName="emergencyContactPhone"
                placeholder="e.g. 0712345678"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none"
                [class.border-red-500]="isFieldInvalid('emergencyContactPhone')"
              />
              <p *ngIf="isFieldInvalid('emergencyContactPhone')" class="text-xs text-red-500 mt-1">{{ getEmergencyPhoneError() }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Relationship
              </label>
              <input
                type="text"
                formControlName="emergencyContactRelationship"
                placeholder="e.g. Spouse, Sibling"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none"
              />
            </div>
          </div>

          <!-- Notes (Optional) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes <span class="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              formControlName="notes"
              placeholder="Add any additional notes about the tenant..."
              rows="2"
              class="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none resize-none"
            ></textarea>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
            <i class="fas fa-exclamation-circle"></i>
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div *ngIf="successMessage" class="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
            <i class="fas fa-check-circle"></i>
            {{ successMessage }}
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              (click)="onCancel()"
              [disabled]="loading"
              class="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="loading"
              [style.background-color]="themeService.accent"
              class="px-6 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 transition hover:opacity-95 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <i *ngIf="loading" class="fas fa-spinner fa-spin"></i>
              <span>{{ loading ? 'Creating...' : (tenantForm.get('unitId')?.value ? 'Create Tenant & 1+ Yr Lease' : 'Create Tenant') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AddTenantFormComponent implements OnInit {
  @Output() tenantCreated = new EventEmitter<PropertyTenant>();
  @Output() closed = new EventEmitter<void>();

  isOpen = false;
  tenantForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  properties: any[] = [];
  units: any[] = [];
  loadingUnits = false;
  selectedPropertyId = '';

  durationOptions = [
    { label: '1 Year', months: 12 },
    { label: '2 Years', months: 24 },
    { label: '3 Years', months: 36 },
  ];

  constructor(
    private fb: FormBuilder,
    private tenantService: PropertyTenantsService,
    private propertiesService: PropertiesService,
    private unitsService: UnitsService,
    private propertyFilterService: PropertyFilterService,
    private authService: AuthService,
    public themeService: ThemeService,
  ) {
    this.initializeForm();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen && !this.loading) {
      this.onCancel();
    }
  }

  ngOnInit(): void {}

  private computeEndDateStr(startDateStr: string, months: number): string {
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) return '';
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  }

  private initializeForm(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.tenantForm = this.fb.group({
      name: ['', Validators.required],
      propertyId: [''],
      unitId: [null],
      startDate: [todayStr],
      endDate: [this.computeEndDateStr(todayStr, 12)],
      leaseDurationMonths: [12],
      paymentDueDay: [5],
      rentAmount: [0],
      depositAmount: [0],
      email: ['', [Validators.email]],
      phone: ['', [Validators.required, this.kenyaPhoneValidator]],
      idNumber: [''],
      kraPin: [''],
      occupation: [''],
      employer: [''],
      address: [''],
      emergencyContactName: [''],
      emergencyContactPhone: ['', [this.kenyaPhoneValidator]],
      emergencyContactRelationship: [''],
      notes: [''],
    });
  }

  private kenyaPhoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = control.value.toString().trim();
    if (!value) return null;
    const kenyaPhoneRegex = /^(?:254|\+254|0)(?:7|1)[0-9]{8}$/;
    if (!kenyaPhoneRegex.test(value)) {
      return { invalidPhone: true };
    }
    return null;
  }

  open(preselectedUnit?: any): void {
    this.isOpen = true;
    this.selectedPropertyId = '';
    this.units = [];
    this.initializeForm();
    this.errorMessage = '';
    this.successMessage = '';
    this.loadProperties(preselectedUnit);
  }

  loadProperties(preselectedUnit?: any): void {
    this.propertiesService.getAll(1, 1000).subscribe({
      next: (res) => {
        this.properties = res.data || [];

        const filterId = this.propertyFilterService.selectedPropertyId;
        const user = this.authService.getUser();
        const userAssignedId = user?.assignedPropertyIds?.[0];

        let defaultPropId = '';
        if (preselectedUnit?.propertyId) {
          defaultPropId = preselectedUnit.propertyId;
        } else if (filterId && this.properties.some((p) => p._id === filterId)) {
          defaultPropId = filterId;
        } else if (userAssignedId && this.properties.some((p) => p._id === userAssignedId)) {
          defaultPropId = userAssignedId;
        } else if (this.properties.length > 0) {
          defaultPropId = this.properties[0]._id;
        }

        if (defaultPropId) {
          this.selectedPropertyId = defaultPropId;
          this.tenantForm.patchValue({ propertyId: defaultPropId });
          this.fetchUnitsForProperty(defaultPropId, preselectedUnit?._id);
        }
      },
      error: (err) => console.error('Failed to load properties for tenant form', err),
    });
  }

  onPropertyChange(event: any): void {
    const propId = event?.target ? event.target.value : event;
    this.selectedPropertyId = propId || '';
    this.tenantForm.patchValue({ unitId: null, rentAmount: 0, depositAmount: 0 });
    this.units = [];
    if (!this.selectedPropertyId) return;

    this.fetchUnitsForProperty(this.selectedPropertyId);
  }

  fetchUnitsForProperty(propId: string, preselectUnitId?: string): void {
    this.loadingUnits = true;
    this.unitsService.getAll(1, 1000, propId).subscribe({
      next: (res) => {
        this.loadingUnits = false;
        const rawUnits = res.data || [];
        this.units = rawUnits
          .filter((u: any) => u.status === 'vacant' || u.status === 'available' || u._id === preselectUnitId)
          .map((u: any) => ({
            ...u,
            displayText: `${u.unitNumber} - KES ${(u.rentAmount || 0).toLocaleString()}/mo`,
          }))
          .sort((a: any, b: any) =>
            (a.unitNumber || '').localeCompare(b.unitNumber || '', undefined, { numeric: true }),
          );

        if (preselectUnitId) {
          const found = this.units.find((u) => u._id === preselectUnitId);
          if (found) {
            this.tenantForm.patchValue({ unitId: found._id });
            this.onUnitSelected(found);
          }
        }
      },
      error: (err) => {
        this.loadingUnits = false;
        console.error('Failed to load units for property', err);
      },
    });
  }

  onUnitSelected(unit: any): void {
    if (!unit) {
      this.tenantForm.patchValue({ rentAmount: 0, depositAmount: 0 });
      return;
    }
    const rent = unit.rentAmount || 0;
    const deposit = unit.securityDeposit || rent || 0;
    this.tenantForm.patchValue({
      rentAmount: rent,
      depositAmount: deposit,
    });
  }

  setLeaseDuration(months: number): void {
    const startStr = this.tenantForm.get('startDate')?.value || new Date().toISOString().split('T')[0];
    this.tenantForm.patchValue({
      leaseDurationMonths: months,
      endDate: this.computeEndDateStr(startStr, months),
    });
  }

  onStartDateChange(): void {
    const startStr = this.tenantForm.get('startDate')?.value;
    const months = this.tenantForm.get('leaseDurationMonths')?.value || 12;
    if (startStr) {
      this.tenantForm.patchValue({
        endDate: this.computeEndDateStr(startStr, months),
      });
    }
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  onCancel(): void {
    this.close();
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.tenantForm.valid) {
      this.tenantForm.markAllAsTouched();
      if (this.tenantForm.get('name')?.invalid) {
        this.errorMessage = 'Please enter tenant full name.';
      } else if (this.tenantForm.get('phone')?.invalid) {
        this.errorMessage = this.getPhoneError() || 'Please enter a valid Kenyan phone number (e.g. 0712345678).';
      } else {
        this.errorMessage = 'Please fill in all required fields (Full Name and Phone Number).';
      }
      return;
    }

    this.loading = true;
    const rawValue = this.tenantForm.getRawValue();
    const formData: any = { ...rawValue };

    if (!formData.email || !formData.email.trim()) {
      delete formData.email;
    } else {
      formData.email = formData.email.trim();
    }

    if (!formData.propertyId) delete formData.propertyId;
    if (!formData.unitId) {
      delete formData.unitId;
      delete formData.startDate;
      delete formData.endDate;
      delete formData.leaseDurationMonths;
      delete formData.paymentDueDay;
      delete formData.rentAmount;
      delete formData.depositAmount;
    }
    if (!formData.idNumber || !formData.idNumber.trim()) delete formData.idNumber;
    if (!formData.address || !formData.address.trim()) delete formData.address;
    if (!formData.emergencyContactName || !formData.emergencyContactName.trim()) delete formData.emergencyContactName;
    if (!formData.emergencyContactPhone || !formData.emergencyContactPhone.trim()) delete formData.emergencyContactPhone;
    if (!formData.kraPin || !formData.kraPin.trim()) delete formData.kraPin;
    if (!formData.occupation || !formData.occupation.trim()) delete formData.occupation;
    if (!formData.employer || !formData.employer.trim()) delete formData.employer;
    if (!formData.emergencyContactRelationship || !formData.emergencyContactRelationship.trim()) {
      delete formData.emergencyContactRelationship;
    }
    if (!formData.notes || !formData.notes.trim()) delete formData.notes;

    this.tenantService.create(formData).subscribe({
      next: (tenant) => {
        this.loading = false;
        this.successMessage = formData.unitId
          ? `Tenant "${tenant.name}" created with an active lease and unit assigned!`
          : `Tenant "${tenant.name}" created successfully!`;
        this.tenantCreated.emit(tenant);
        setTimeout(() => {
          this.close();
        }, 1200);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to create tenant. Please try again.';
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.tenantForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getPhoneError(): string {
    const phone = this.tenantForm.get('phone');
    if (phone?.hasError('required')) return 'Phone number is required';
    if (phone?.hasError('invalidPhone')) return 'Please enter a valid Kenyan phone number (e.g. 0712345678)';
    return '';
  }

  getEmergencyPhoneError(): string {
    const phone = this.tenantForm.get('emergencyContactPhone');
    if (phone?.hasError('invalidPhone')) return 'Please enter a valid Kenyan phone number (e.g. 0712345678)';
    return '';
  }
}
