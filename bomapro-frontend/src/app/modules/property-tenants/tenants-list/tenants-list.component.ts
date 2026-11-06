import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { LeasesService } from '../../../shared/services/leases/leases.service';
import { PaymentsService } from '../../../shared/services/payments/payments.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { PropertyFilterService } from '../../../shared/services/property-filter/property-filter.service';
import { PropertyTenant, Lease, Payment } from '../../../shared/interfaces/models';
import { AddTenantFormComponent } from '../add-tenant-form/add-tenant-form.component';
import { LeaseFormComponent } from '../../leases/lease-form/lease-form.component';

@Component({
  selector: 'app-tenants-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AddTenantFormComponent, LeaseFormComponent],
  templateUrl: './tenants-list.component.html',
  styleUrls: ['./tenants-list.component.scss'],
})
export class TenantsListComponent implements OnInit, OnDestroy {
  @ViewChild(AddTenantFormComponent) addTenantForm!: AddTenantFormComponent;

  tenants: PropertyTenant[] = [];
  loading = true;
  search = '';
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;
  Math = Math;

  // Quick Lease Creation Modal State (Assign Unit & 1-Yr Lease to existing tenant)
  leaseModalOpen = false;
  tenantForNewLease: PropertyTenant | null = null;

  // View Tenant Modal State
  isViewModalOpen = false;
  selectedTenant: PropertyTenant | null = null;
  loadingTenantDetails = false;
  tenantLeases: Lease[] = [];
  tenantPayments: Payment[] = [];
  totalPaid = 0;
  activeRentAmount = 0;
  activeCurrency = 'KES';
  activeTab: 'overview' | 'payments' | 'leases' = 'overview';
  reminderSending = false;
  reminderMsg = '';

  private filterSub: Subscription | null = null;

  constructor(
    private tenantsService: PropertyTenantsService,
    private leasesService: LeasesService,
    private paymentsService: PaymentsService,
    public themeService: ThemeService,
    private propertyFilterService: PropertyFilterService,
    public router: Router,
  ) {}

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isViewModalOpen && !this.leaseModalOpen) {
      this.closeViewModal();
    }
  }

  ngOnInit(): void {
    this.filterSub = this.propertyFilterService.selectedPropertyId$.subscribe(() => {
      this.page = 1;
      this.loadTenants();
    });
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  loadTenants(): void {
    this.loading = true;
    const pid = this.propertyFilterService.selectedPropertyId || undefined;
    this.tenantsService.getAll(this.page, this.limit, this.search || undefined, pid).subscribe({
      next: (res) => {
        this.tenants = res.data || [];
        this.total = res.total;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadTenants();
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadTenants();
  }

  openAddTenantForm(): void {
    this.addTenantForm.open();
  }

  onTenantCreated(tenant: any): void {
    this.loadTenants();
  }

  openAssignLeaseModal(tenant: PropertyTenant, event?: Event): void {
    if (event) event.stopPropagation();
    this.tenantForNewLease = tenant;
    this.leaseModalOpen = true;
  }

  closeAssignLeaseModal(): void {
    this.leaseModalOpen = false;
    this.tenantForNewLease = null;
  }

  onLeaseCreated(lease: Lease): void {
    const currentSelectedId = this.selectedTenant?._id;
    this.closeAssignLeaseModal();
    this.loadTenants();
    if (this.isViewModalOpen && currentSelectedId) {
      this.viewTenant(currentSelectedId);
    }
  }

  navigateToLease(leaseId: string | undefined, event?: Event): void {
    if (event) event.stopPropagation();
    if (!leaseId) return;
    this.closeViewModal();
    this.router.navigate(['/leases', leaseId]);
  }

  navigateToUnit(unitId: string | undefined, event?: Event): void {
    if (event) event.stopPropagation();
    if (!unitId) return;
    this.closeViewModal();
    this.router.navigate(['/units', unitId]);
  }

  viewTenant(tenantOrId: PropertyTenant | string): void {
    const id = typeof tenantOrId === 'string' ? tenantOrId : tenantOrId._id;
    const initialTenant =
      typeof tenantOrId === 'string'
        ? this.tenants.find((t) => t._id === id) || null
        : tenantOrId;

    this.selectedTenant = initialTenant;
    this.isViewModalOpen = true;
    this.loadingTenantDetails = true;
    this.tenantLeases = [];
    this.tenantPayments = [];
    this.totalPaid = 0;
    this.activeRentAmount = initialTenant?.rentAmount || 0;
    this.activeCurrency = initialTenant?.currency || 'KES';
    this.activeTab = 'overview';
    this.reminderMsg = '';

    this.tenantsService.getById(id).subscribe({
      next: (fullTenant) => {
        this.selectedTenant = { ...(initialTenant || {}), ...fullTenant };
        if (fullTenant.rentAmount) this.activeRentAmount = fullTenant.rentAmount;
        if (fullTenant.currency) this.activeCurrency = fullTenant.currency;
        this.loadLeasesAndPayments(id);
      },
      error: () => {
        this.loadLeasesAndPayments(id);
      },
    });
  }

  private loadLeasesAndPayments(id: string): void {
    let leasesLoaded = false;
    let paymentsLoaded = false;

    const checkComplete = () => {
      if (leasesLoaded && paymentsLoaded) {
        this.loadingTenantDetails = false;
      }
    };

    this.leasesService.getByTenant(id).subscribe({
      next: (leases) => {
        this.tenantLeases = leases || [];
        const activeLease = this.tenantLeases.find((l) => l.status === 'active') || this.tenantLeases[0];
        if (activeLease) {
          if (!this.activeRentAmount && activeLease.rentAmount) {
            this.activeRentAmount = activeLease.rentAmount;
          }
          if (activeLease.currency) {
            this.activeCurrency = activeLease.currency;
          }
          if (this.selectedTenant && !this.selectedTenant.propertyName && activeLease.propertyName) {
            this.selectedTenant.propertyName = activeLease.propertyName;
          }
        }
        leasesLoaded = true;
        checkComplete();
      },
      error: () => {
        leasesLoaded = true;
        checkComplete();
      },
    });

    this.paymentsService.getByTenant(id).subscribe({
      next: (payments) => {
        this.tenantPayments = payments || [];
        this.totalPaid = this.tenantPayments
          .filter((p) => p.status === 'completed')
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        paymentsLoaded = true;
        checkComplete();
      },
      error: () => {
        paymentsLoaded = true;
        checkComplete();
      },
    });
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedTenant = null;
    this.reminderMsg = '';
  }

  sendReminder(): void {
    if (!this.selectedTenant) return;
    this.reminderSending = true;
    this.reminderMsg = '';
    this.paymentsService.sendReminder(this.selectedTenant._id).subscribe({
      next: (res: any) => {
        this.reminderMsg = res?.message || 'Payment reminder sent successfully.';
        this.reminderSending = false;
        setTimeout(() => (this.reminderMsg = ''), 4000);
      },
      error: () => {
        this.reminderSending = false;
        this.reminderMsg = 'Failed to send reminder. Please try again.';
        setTimeout(() => (this.reminderMsg = ''), 4000);
      },
    });
  }

  deleteTenant(id: string): void {
    if (confirm('Are you sure you want to delete this tenant? Any active lease will be terminated and their unit marked vacant.')) {
      this.tenantsService.delete(id).subscribe({
        next: () => {
          if (this.selectedTenant?._id === id) {
            this.closeViewModal();
          }
          this.loadTenants();
        },
        error: (err) => {
          console.error('Error deleting tenant:', err);
        },
      });
    }
  }
}
