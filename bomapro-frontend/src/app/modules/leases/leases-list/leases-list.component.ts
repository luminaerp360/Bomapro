import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LeasesService } from '../../../shared/services/leases/leases.service';
import { PaymentsService } from '../../../shared/services/payments/payments.service';
import { UnitsService } from '../../../shared/services/units/units.service';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { Lease, LeaseStatus } from '../../../shared/interfaces/models';
import { LeaseFormComponent } from '../lease-form/lease-form.component';
import { PaymentFormComponent } from '../../payments/payment-form/payment-form.component';

@Component({
  selector: 'app-leases-list',
  templateUrl: './leases-list.component.html',
  styleUrls: ['./leases-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LeaseFormComponent, PaymentFormComponent],
})
export class LeasesListComponent implements OnInit {
  leases: Lease[] = [];
  expiringLeases: Lease[] = [];
  occupancyStats: any = null;
  loading = true;
  search = '';
  statusFilter = '';
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;
  formModalOpen = false;
  selectedLease: Lease | null = null;
  statuses: LeaseStatus[] = ['draft', 'active', 'expired', 'terminated', 'renewed'];
  isTenant = false;
  
  // Payment tracking
  leasePaymentData: Map<string, any> = new Map();
  expandedLeaseId: string | null = null;
  showPaymentForm = false;
  selectedLeaseForPayment: Lease | null = null;

  constructor(
    private leasesService: LeasesService,
    private paymentsService: PaymentsService,
    private unitsService: UnitsService,
    private propertyTenantsService: PropertyTenantsService,
    public themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isTenant = user?.role === 'tenant';
    
    this.loadLeases();
    if (!this.isTenant) {
      this.loadExpiringLeases();
      this.loadStats();
    }
  }

  loadLeases(): void {
    this.loading = true;
    this.leasesService.getAll(this.page, this.limit, this.search || undefined, this.statusFilter || undefined).subscribe({
      next: (res) => {
        // If tenant, filter to show only their own leases
        if (this.isTenant) {
          const user = this.authService.getUser();
          this.leases = res.data.filter((lease: any) => {
            return lease.propertyTenantId === user?._id || lease.tenantId === user?._id;
          });
        } else {
          this.leases = res.data;
        }
        this.total = this.leases.length;
        this.totalPages = Math.ceil(this.total / this.limit);
        
        // Batch load unit and tenant data for all leases at once
        this.enrichLeasesWithUnitAndTenantData();
        this.loading = false;
      },
      error: () => { 
        this.loading = false; 
      },
    });
  }

  private enrichLeasesWithUnitAndTenantData(): void {
    // Collect unique unit and property tenant IDs
    const unitIds = new Set<string>();
    const tenantIds = new Set<string>();

    this.leases.forEach((lease) => {
      if (lease.unitId && !lease.unitNumber) unitIds.add(lease.unitId);
      if (lease.propertyTenantId && !lease.propertyTenantName) tenantIds.add(lease.propertyTenantId);
    });

    // If there are IDs to fetch, batch load them
    if (unitIds.size > 0 || tenantIds.size > 0) {
      const requests: any = {};

      // Batch load units
      if (unitIds.size > 0) {
        Array.from(unitIds).forEach(id => {
          requests[`unit_${id}`] = this.unitsService.getById(id);
        });
      }

      // Batch load tenants
      if (tenantIds.size > 0) {
        Array.from(tenantIds).forEach(id => {
          requests[`tenant_${id}`] = this.propertyTenantsService.getById(id);
        });
      }

      // Execute all requests in parallel
      if (Object.keys(requests).length > 0) {
        forkJoin(requests).subscribe({
          next: (results: any) => {
            // Map results back to leases
            this.leases.forEach((lease) => {
              if (lease.unitId) {
                const unit = results[`unit_${lease.unitId}`];
                if (unit) lease.unitNumber = unit.unitNumber;
              }
              if (lease.propertyTenantId) {
                const tenant = results[`tenant_${lease.propertyTenantId}`];
                if (tenant) lease.propertyTenantName = tenant.name;
              }
            });
          },
          error: (err) => console.error('Error enriching leases:', err),
        });
      }
    }
  }

  loadExpiringLeases(): void {
    this.leasesService.getExpiringSoon(30).subscribe({
      next: (leases) => {
        this.expiringLeases = leases || [];
      },
      error: () => {
        this.expiringLeases = [];
      },
    });
  }

  loadStats(): void {
    this.leasesService.getStats().subscribe({
      next: (stats) => {
        this.occupancyStats = stats;
      },
      error: () => {
        this.occupancyStats = null;
      },
    });
  }

  getRenewalDate(lease: Lease): Date | null {
    if (!lease.endDate) return null;
    const endDate = new Date(lease.endDate);
    endDate.setDate(endDate.getDate() + 1);
    return endDate;
  }

  getDaysUntilExpiry(lease: Lease): number {
    if (!lease.endDate) return -1;
    const today = new Date();
    const end = new Date(lease.endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  getIsExpiringWithin30Days(lease: Lease): boolean {
    const days = this.getDaysUntilExpiry(lease);
    return days > 0 && days <= 30;
  }

  renewLease(lease: Lease): void {
    if (!lease.endDate || !confirm(`Create renewal lease for ${lease.leaseNumber}?`)) return;

    const startDate = new Date(lease.endDate);
    startDate.setDate(startDate.getDate() + 1);
    
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const renewalData: Partial<Lease> = {
      tenantId: lease.tenantId,
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      propertyTenantId: lease.propertyTenantId,
      leaseNumber: `${lease.leaseNumber}-RENEW`,
      status: 'draft',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      rentAmount: lease.rentAmount,
      currency: lease.currency,
      depositAmount: lease.depositAmount,
      depositPaid: false,
      paymentFrequency: lease.paymentFrequency,
      paymentDueDay: lease.paymentDueDay,
      terms: lease.terms,
      renewedFromLeaseId: lease._id,
      propertyTenantName: lease.propertyTenantName,
      propertyName: lease.propertyName,
    };

    this.leasesService.create(renewalData).subscribe({
      next: () => {
        alert('Lease renewal created. Activate it when ready.');
        this.loadLeases();
        this.loadExpiringLeases();
      },
      error: () => alert('Failed to create renewal lease'),
    });
  }

  onSearch(): void { 
    this.page = 1; 
    this.loadLeases(); 
  }

  onFilterChange(): void { 
    this.page = 1; 
    this.loadLeases(); 
  }

  goToPage(p: number): void { 
    this.page = p; 
    this.loadLeases(); 
  }

  openCreateModal(): void {
    this.selectedLease = null;
    this.formModalOpen = true;
  }

  closeFormModal(): void {
    this.formModalOpen = false;
    this.selectedLease = null;
  }

  onLeaseSaved(lease: Lease): void {
    this.closeFormModal();
    this.loadLeases();
    this.loadExpiringLeases();
    this.loadStats();
  }

  viewLease(id: string | undefined): void { 
    if (id) {
      this.router.navigate(['/leases', id]); 
    }
  }

  editLease(lease: Lease): void {
    this.selectedLease = lease;
    this.formModalOpen = true;
  }

  deleteLease(id: string | undefined): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this lease?')) {
      this.leasesService.delete(id).subscribe({
        next: () => {
          this.loadLeases();
          this.loadExpiringLeases();
        },
        error: (err) => {
          console.error('Delete error:', err);
        },
      });
    }
  }

  getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400',
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      terminated: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      renewed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return map[status] || '';
  }

  // Payment Management Methods
  toggleLeaseDetails(leaseId: string, lease: Lease): void {
    if (this.expandedLeaseId === leaseId) {
      this.expandedLeaseId = null;
      return;
    }
    
    this.expandedLeaseId = leaseId;
    
    // Load payment data if not already loaded
    if (!this.leasePaymentData.has(leaseId)) {
      this.loadLeasePaymentData(leaseId);
    }
  }

  loadLeasePaymentData(leaseId: string): void {
    this.paymentsService.getByLease(leaseId).subscribe({
      next: (payments) => {
        const today = new Date();
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(currentMonth);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const lease = this.leases.find(l => l._id === leaseId);
        if (!lease) return;

        // Calculate current month breakdown
        const currentMonthPayments = payments.filter(p => {
          const payDate = new Date(p.paymentDate);
          return payDate >= currentMonth && payDate < new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        });

        const currentMonthPaid = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
        const currentMonthBalance = lease.rentAmount - currentMonthPaid;

        // Calculate last month breakdown
        const lastMonthEnd = new Date(currentMonth);
        lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
        const lastMonthPayments = payments.filter(p => {
          const payDate = new Date(p.paymentDate);
          return payDate >= lastMonth && payDate < currentMonth;
        });

        const lastMonthPaid = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);
        const lastMonthBalance = lease.rentAmount - lastMonthPaid;

        this.leasePaymentData.set(leaseId, {
          currentMonth: {
            date: currentMonth,
            due: lease.rentAmount,
            paid: currentMonthPaid,
            balance: Math.max(0, currentMonthBalance),
            isPaid: currentMonthBalance <= 0,
            payments: currentMonthPayments,
          },
          lastMonth: {
            date: lastMonth,
            due: lease.rentAmount,
            paid: lastMonthPaid,
            balance: Math.max(0, lastMonthBalance),
            isPaid: lastMonthBalance <= 0,
            payments: lastMonthPayments,
          },
          totalPayments: payments.length,
        });
      },
      error: (err) => console.error('Error loading payment data:', err),
    });
  }

  openPaymentForm(lease: Lease): void {
    this.selectedLeaseForPayment = lease;
    this.showPaymentForm = true;
  }

  closePaymentForm(): void {
    this.showPaymentForm = false;
    this.selectedLeaseForPayment = null;
  }

  onPaymentSaved(event: any): void {
    this.closePaymentForm();
    // Reload payment data for the lease
    if (this.selectedLeaseForPayment?._id) {
      this.leasePaymentData.delete(this.selectedLeaseForPayment._id);
      this.loadLeasePaymentData(this.selectedLeaseForPayment._id);
    }
  }
}
