import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { UnitsService } from '../../../shared/services/units/units.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { PropertyTenant } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-add-tenant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" *ngIf="isOpen">
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 w-full max-w-2xl mx-4 max-h-[95vh] overflow-y-auto">
        <!-- Header -->
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Add Tenant</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new tenant record in the system</p>
        </div>

        <!-- Form -->
        <form [formGroup]="tenantForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Full Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g., John Kariuki"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
              [style.--tw-ring-color]="themeService.accent"
              [class.border-red-500]="isFieldInvalid('name')"
            />
            <p *ngIf="isFieldInvalid('name')" class="text-sm text-red-500 mt-1">Full name is required</p>
          </div>

          <!-- Assign to Property & Unit (Optional) -->
          <div class="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="fas fa-building text-emerald-600 dark:text-emerald-400"></i>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Assign to Property & Unit (Optional)</h3>
              </div>
              <span class="text-2xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">Direct Assignment</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Choose a property and unit to automatically link this tenant and mark the unit occupied.</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <!-- Property Selector -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Property
                </label>
                <select
                  formControlName="propertyId"
                  (change)="onPropertyChange($event)"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                  [style.--tw-ring-color]="themeService.accent"
                >
                  <option value="">-- None / Assign Later --</option>
                  <option *ngFor="let p of properties" [value]="p._id">{{ p.name }}</option>
                </select>
              </div>

              <!-- Unit Selector -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Unit</span>
                  <span *ngIf="loadingUnits" class="text-xs text-emerald-600 dark:text-emerald-400"><i class="fas fa-spinner fa-spin"></i> Loading...</span>
                </label>
                <select
                  formControlName="unitId"
                  [disabled]="!selectedPropertyId || loadingUnits"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition disabled:opacity-50"
                  [style.--tw-ring-color]="themeService.accent"
                >
                  <option value="">{{ selectedPropertyId ? (units.length === 0 && !loadingUnits ? 'No units found in property' : '-- Select Unit --') : '-- Choose Property First --' }}</option>
                  <option *ngFor="let u of units" [value]="u._id" [disabled]="u.status === 'occupied'">
                    {{ u.unitNumber }} - {{ u.status === 'occupied' ? '(Occupied)' : ('KES ' + (u.rentAmount | number) + '/mo') }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Email and Phone -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email <span class="text-gray-400">(optional)</span>
              </label>
              <input
                type="email"
                formControlName="email"
                placeholder="john@example.com"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('email')"
              />
              <p *ngIf="isFieldInvalid('email')" class="text-sm text-red-500 mt-1">Please enter a valid email address</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number <span class="text-red-500">*</span>
              </label>
              <input
                type="tel"
                formControlName="phone"
                placeholder="0712345678"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('phone')"
              />
              <p *ngIf="isFieldInvalid('phone')" class="text-sm text-red-500 mt-1">{{ getPhoneError() }}</p>
            </div>
          </div>

          <!-- ID Number and KRA PIN -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID Number <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="idNumber"
                placeholder="12345678"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('idNumber')"
              />
              <p *ngIf="isFieldInvalid('idNumber')" class="text-sm text-red-500 mt-1">ID number is required</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                KRA PIN <span class="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                formControlName="kraPin"
                placeholder="A001234567U"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
              />
            </div>
          </div>

          <!-- Occupation and Employer -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Occupation <span class="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                formControlName="occupation"
                placeholder="e.g., Software Engineer"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employer <span class="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                formControlName="employer"
                placeholder="e.g., Tech Company Ltd"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
              />
            </div>
          </div>

          <!-- Address -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="address"
              placeholder="123 Main Street, Nairobi"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
              [style.--tw-ring-color]="themeService.accent"
              [class.border-red-500]="isFieldInvalid('address')"
            />
            <p *ngIf="isFieldInvalid('address')" class="text-sm text-red-500 mt-1">Address is required</p>
          </div>

          <!-- Emergency Contact Name and Phone -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emergency Contact Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="emergencyContactName"
                placeholder="Jane Kariuki"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('emergencyContactName')"
              />
              <p *ngIf="isFieldInvalid('emergencyContactName')" class="text-sm text-red-500 mt-1">Emergency contact name is required</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emergency Contact Phone <span class="text-red-500">*</span>
              </label>
              <input
                type="tel"
                formControlName="emergencyContactPhone"
                placeholder="0712345678"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
                [style.--tw-ring-color]="themeService.accent"
                [class.border-red-500]="isFieldInvalid('emergencyContactPhone')"
              />
              <p *ngIf="isFieldInvalid('emergencyContactPhone')" class="text-sm text-red-500 mt-1">{{ getEmergencyPhoneError() }}</p>
            </div>
          </div>

          <!-- Emergency Contact Relationship -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Relationship <span class="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              formControlName="emergencyContactRelationship"
              placeholder="e.g., Sister, Brother, Spouse"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition"
              [style.--tw-ring-color]="themeService.accent"
            />
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes <span class="text-gray-400">(optional)</span>
            </label>
            <textarea
              formControlName="notes"
              placeholder="Add any additional notes about the tenant..."
              rows="3"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition resize-none"
              [style.--tw-ring-color]="themeService.accent"
            ></textarea>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
            <i class="fas fa-exclamation-circle"></i>
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div *ngIf="successMessage" class="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
            <i class="fas fa-check-circle"></i>
            {{ successMessage }}
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              (click)="onCancel()"
              [disabled]="loading"
              class="px-6 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="!tenantForm.valid || loading"
              [style.background-color]="(tenantForm.valid && !loading) ? themeService.accent : '#ccc'"
              class="px-6 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i *ngIf="loading" class="fas fa-spinner fa-spin"></i>
              <span>{{ loading ? 'Creating...' : 'Create Tenant' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      :host ::ng-deep {
        input:focus,
        textarea:focus,
        select:focus {
          @apply ring-2 ring-offset-0;
        }
      }
    `,
  ],
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

  constructor(
    private fb: FormBuilder,
    private tenantService: PropertyTenantsService,
    private propertiesService: PropertiesService,
    private unitsService: UnitsService,
    public themeService: ThemeService,
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {}

  private initializeForm(): void {
    this.tenantForm = this.fb.group({
      name: ['', Validators.required],
      propertyId: [''],
      unitId: [''],
      email: ['', [Validators.email]],
      phone: ['', [Validators.required, this.kenyaPhoneValidator]],
      idNumber: ['', Validators.required],
      kraPin: [''],
      occupation: [''],
      employer: [''],
      address: ['', Validators.required],
      emergencyContactName: ['', Validators.required],
      emergencyContactPhone: ['', [Validators.required, this.kenyaPhoneValidator]],
      emergencyContactRelationship: [''],
      notes: [''],
    });
  }

  /**
   * Phone number validator for Kenyan numbers
   * Accepts formats: 0712345678, +254712345678, 254712345678
   */
  private kenyaPhoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const value = control.value.toString().trim();
    const kenyaPhoneRegex = /^(?:254|\+254|0)(?:7|1)[0-9]{8}$/;

    if (!kenyaPhoneRegex.test(value)) {
      return { invalidPhone: true };
    }
    return null;
  }

  open(): void {
    this.isOpen = true;
    this.selectedPropertyId = '';
    this.units = [];
    this.initializeForm();
    this.errorMessage = '';
    this.successMessage = '';
    this.loadProperties();
  }

  loadProperties(): void {
    this.propertiesService.getAll(1, 1000).subscribe({
      next: (res) => {
        this.properties = res.data || [];
      },
      error: (err) => console.error('Failed to load properties for tenant form', err),
    });
  }

  onPropertyChange(event: any): void {
    const propId = event.target?.value || '';
    this.selectedPropertyId = propId;
    this.tenantForm.patchValue({ unitId: '' });
    this.units = [];
    if (!propId) return;

    this.loadingUnits = true;
    this.unitsService.getAll(1, 1000, propId).subscribe({
      next: (res) => {
        this.loadingUnits = false;
        this.units = (res.data || []).sort((a: any, b: any) => {
          if (a.status === 'vacant' && b.status !== 'vacant') return -1;
          if (a.status !== 'vacant' && b.status === 'vacant') return 1;
          return (a.unitNumber || '').localeCompare(b.unitNumber || '', undefined, { numeric: true });
        });
      },
      error: (err) => {
        this.loadingUnits = false;
        console.error('Failed to load units for property', err);
      },
    });
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  onCancel(): void {
    this.close();
  }

  onSubmit(): void {
    if (!this.tenantForm.valid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const rawValue = this.tenantForm.value;
    const formData: any = { ...rawValue };

    // Clean up optional fields so empty strings don't fail validation
    if (!formData.email || !formData.email.trim()) {
      delete formData.email;
    } else {
      formData.email = formData.email.trim();
    }

    if (!formData.propertyId) delete formData.propertyId;
    if (!formData.unitId) delete formData.unitId;
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
        this.successMessage = `Tenant "${tenant.name}" created successfully!`;
        this.tenantCreated.emit(tenant);
        setTimeout(() => {
          this.close();
        }, 2000);
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
    if (phone?.hasError('invalidPhone')) return 'Please enter a valid Kenyan phone number (0712345678)';
    return '';
  }

  getEmergencyPhoneError(): string {
    const phone = this.tenantForm.get('emergencyContactPhone');
    if (phone?.hasError('required')) return 'Emergency contact phone is required';
    if (phone?.hasError('invalidPhone')) return 'Please enter a valid Kenyan phone number (0712345678)';
    return '';
  }
}
