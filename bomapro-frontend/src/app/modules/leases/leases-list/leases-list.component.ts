import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { LeasesService } from '../../../shared/services/leases/leases.service';
import { PaymentsService } from '../../../shared/services/payments/payments.service';
import { UnitsService } from '../../../shared/services/units/units.service';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { PropertyFilterService } from '../../../shared/services/property-filter/property-filter.service';
import { Lease, LeaseStatus, Property } from '../../../shared/interfaces/models';
import { LeaseFormComponent } from '../lease-form/lease-form.component';
import { PaymentFormComponent } from '../../payments/payment-form/payment-form.component';

@Component({
  selector: 'app-leases-list',
  templateUrl: './leases-list.component.html',
  styleUrls: ['./leases-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LeaseFormComponent, PaymentFormComponent],
})
export class LeasesListComponent implements OnInit, OnDestroy {
  leases: Lease[] = [];
  expiringLeases: Lease[] = [];
  properties: Property[] = [];
  loading = true;
  search = '';
  statusFilter = '';
  propertyFilter = '';
  paymentStatusFilter = ''; // '' | 'has_balance' | 'paid'
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

  private filterSub: Subscription | null = null;

  constructor(
    private leasesService: LeasesService,
    private paymentsService: PaymentsService,
    private unitsService: UnitsService,
    private propertyTenantsService: PropertyTenantsService,
    private propertiesService: PropertiesService,
    public themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
    public propertyFilterService: PropertyFilterService,
  ) {}

  get filteredLeases(): Lease[] {
    let result = this.leases;
    if (this.propertyFilter) {
      result = result.filter(l => l.propertyId === this.propertyFilter);
    }
    if (this.paymentStatusFilter === 'has_balance') {
      result = result.filter(l => {
        const data = this.leasePaymentData.get(l._id || '');
        return data ? data.totalBalance > 0 : true;
      });
    } else if (this.paymentStatusFilter === 'paid') {
      result = result.filter(l => {
        const data = this.leasePaymentData.get(l._id || '');
        return data ? data.currentMonth?.isPaid : false;
      });
    }
    return result;
  }

  get computedStats(): any {
    const filtered = this.filteredLeases;
    const active = filtered.filter(l => l.status === 'active');
    const monthlyRevenue = active.reduce((s, l) => s + (l.rentAmount || 0), 0);
    let totalBalance = 0;
    let paidThisMonth = 0;
    let pendingThisMonth = 0;
    filtered.forEach(l => {
      const data = this.leasePaymentData.get(l._id || '');
      if (data) {
        totalBalance += data.totalBalance || 0;
        if (data.currentMonth?.isPaid) paidThisMonth++;
        else pendingThisMonth++;
      }
    });
    return { activeLeases: active.length, totalLeases: filtered.length, monthlyRevenue, totalBalance, paidThisMonth, pendingThisMonth };
  }

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isTenant = user?.role === 'tenant';
    this.filterSub = this.propertyFilterService.selectedPropertyId$.subscribe(id => {
      this.propertyFilter = id;
    });
    this.loadLeases();
    this.loadProperties();
    if (!this.isTenant) {
      this.loadExpiringLeases();
    }
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  loadProperties(): void {
    this.propertiesService.getAll(1, 100).subscribe({
      next: (res) => {
        this.properties = res.data || [];
        // Enrich any already-loaded leases with property names
        this.enrichPropertyNames();
      },
      error: () => {},
    });
  }

  private enrichPropertyNames(): void {
    this.leases.forEach(lease => {
      if (lease.propertyId && !lease.propertyName) {
        const prop = this.properties.find(p => p._id === lease.propertyId);
        if (prop) lease.propertyName = prop.name;
      }
    });
  }

  loadLeases(): void {
    this.loading = true;
    this.leasesService.getAll(this.page, this.limit, this.search || undefined, this.statusFilter || undefined).subscribe({
      next: (res) => {
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
        this.enrichLeasesWithUnitAndTenantData();
        this.loadAllPaymentData();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadAllPaymentData(): void {
    if (this.leases.length === 0) return;
    this.leasePaymentData.clear();

    // ── Single bulk payment fetch for all current-page leases ──────────────
    // Fetch all payments then partition by leaseId client-side.
    // This replaces N individual getByLease() calls with 1 call.
    this.paymentsService.getAll(1, 2000).subscribe({
      next: (res) => {
        const allPayments = res.data || [];
        // Build a map: leaseId → Payment[]
        const byLease = new Map<string, any[]>();
        allPayments.forEach((p: any) => {
          if (!byLease.has(p.leaseId)) byLease.set(p.leaseId, []);
          byLease.get(p.leaseId)!.push(p);
        });

        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        this.leases.forEach(lease => {
          if (!lease._id) return;
          const payments = byLease.get(lease._id) || [];

          const currentMonthPayments = payments.filter(p => {
            const d = new Date(p.paymentDate);
            return d >= currentMonthStart && d < nextMonthStart;
          });
          const currentMonthPaid = currentMonthPayments.reduce((s, p) => s + p.amount, 0);

          const lastMonthPayments = payments.filter(p => {
            const d = new Date(p.paymentDate);
            return d >= lastMonthStart && d < currentMonthStart;
          });
          const lastMonthPaid = lastMonthPayments.reduce((s, p) => s + p.amount, 0);

          const currentMonthRentPaid = currentMonthPayments
            .filter(p => (p as any).paymentType === 'rent')
            .reduce((s, p) => s + p.amount, 0);

          const lastMonthRentPaid = lastMonthPayments
            .filter(p => (p as any).paymentType === 'rent')
            .reduce((s, p) => s + p.amount, 0);

          const leaseStart = new Date(lease.startDate);
          const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

          // Walk month-by-month; overpayment credit carries forward to next month
          let totalBalance = 0;
          let credit = 0;
          let currentMonthBalance = Math.max(0, lease.rentAmount - currentMonthRentPaid);
          let currentMonthIsPaid = currentMonthRentPaid >= lease.rentAmount;
          let lastMonthBalance = Math.max(0, lease.rentAmount - lastMonthRentPaid);
          let lastMonthIsPaid = lastMonthRentPaid >= lease.rentAmount;

          const iterMonth = new Date(leaseStart.getFullYear(), leaseStart.getMonth(), 1);
          while (iterMonth <= thisMonthStart) {
            const iterEnd = new Date(iterMonth.getFullYear(), iterMonth.getMonth() + 1, 1);
            const monthRentPaid = payments
              .filter(p => (p as any).paymentType === 'rent')
              .filter(p => { const d = new Date(p.paymentDate); return d >= iterMonth && d < iterEnd; })
              .reduce((s, p) => s + p.amount, 0);
            const effective = monthRentPaid + credit;
            if (effective >= lease.rentAmount) {
              credit = effective - lease.rentAmount;
              if (iterMonth.getTime() === lastMonthStart.getTime()) { lastMonthBalance = 0; lastMonthIsPaid = true; }
              if (iterMonth.getTime() === thisMonthStart.getTime()) { currentMonthBalance = 0; currentMonthIsPaid = true; }
            } else {
              const shortfall = lease.rentAmount - effective;
              totalBalance += shortfall;
              credit = 0;
              if (iterMonth.getTime() === lastMonthStart.getTime()) { lastMonthBalance = shortfall; lastMonthIsPaid = false; }
              if (iterMonth.getTime() === thisMonthStart.getTime()) { currentMonthBalance = shortfall; currentMonthIsPaid = false; }
            }
            iterMonth.setMonth(iterMonth.getMonth() + 1);
          }

          this.leasePaymentData.set(lease._id, {
            currentMonth: {
              due: lease.rentAmount,
              paid: currentMonthRentPaid,
              balance: currentMonthBalance,
              isPaid: currentMonthIsPaid,
              payments: currentMonthPayments,
            },
            lastMonth: {
              due: lease.rentAmount,
              paid: lastMonthRentPaid,
              balance: lastMonthBalance,
              isPaid: lastMonthIsPaid,
              payments: lastMonthPayments,
            },
            totalPaid,
            totalBalance,
            totalPayments: payments.length,
            advanceCredit: credit,
          });
        });
      },
      error: () => {},
    });
  }

  private enrichLeasesWithUnitAndTenantData(): void {
    this.enrichPropertyNames();

    const missingUnits = this.leases.filter(l => l.unitId && !l.unitNumber).length > 0;
    const missingTenants = this.leases.filter(l => l.propertyTenantId && !l.propertyTenantName).length > 0;

    if (!missingUnits && !missingTenants) return;

    // ── Single bulk fetch for units and tenants ─────────────────────────────
    const calls: any = {};
    if (missingUnits) calls['units'] = this.unitsService.getAll(1, 1000);
    if (missingTenants) calls['tenants'] = this.propertyTenantsService.getAll(1, 1000);

    forkJoin(calls).subscribe({
      next: (results: any) => {
        if (results['units']) {
          const unitMap = new Map<string, any>();
          (results['units'].data || []).forEach((u: any) => unitMap.set(u._id, u));
          this.leases.forEach(lease => {
            if (lease.unitId && !lease.unitNumber) {
              const u = unitMap.get(lease.unitId);
              if (u) lease.unitNumber = u.unitNumber || u.name;
            }
          });
        }
        if (results['tenants']) {
          const tenantMap = new Map<string, any>();
          (results['tenants'].data || []).forEach((t: any) => tenantMap.set(t._id, t));
          this.leases.forEach(lease => {
            if (lease.propertyTenantId && !lease.propertyTenantName) {
              const t = tenantMap.get(lease.propertyTenantId);
              if (t) lease.propertyTenantName = t.name;
            }
          });
        }
        this.enrichPropertyNames();
      },
      error: () => {},
    });
  }

  loadExpiringLeases(): void {
    this.leasesService.getExpiringSoon(30).subscribe({
      next: (leases) => { this.expiringLeases = leases || []; },
      error: () => { this.expiringLeases = []; },
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

  onClientFilterChange(): void {
    // client-side filter only (property, paymentStatus) — no reload needed
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
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        const lease = this.leases.find(l => l._id === leaseId);
        if (!lease) return;

        const currentMonthPayments = payments.filter(p => {
          const d = new Date(p.paymentDate);
          return d >= currentMonthStart && d < new Date(today.getFullYear(), today.getMonth() + 1, 1);
        });
        const currentMonthPaid = currentMonthPayments.reduce((s, p) => s + p.amount, 0);

        const lastMonthPayments = payments.filter(p => {
          const d = new Date(p.paymentDate);
          return d >= lastMonthStart && d < currentMonthStart;
        });
        const lastMonthPaid = lastMonthPayments.reduce((s, p) => s + p.amount, 0);

        const currentMonthRentPaid = currentMonthPayments
          .filter(p => (p as any).paymentType === 'rent')
          .reduce((s, p) => s + p.amount, 0);
        const lastMonthRentPaid = lastMonthPayments
          .filter(p => (p as any).paymentType === 'rent')
          .reduce((s, p) => s + p.amount, 0);

        const leaseStart = new Date(lease.startDate);
        const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
        let totalBalance = 0;
        let credit = 0;
        let currentMonthBalance = Math.max(0, lease.rentAmount - currentMonthRentPaid);
        let currentMonthIsPaid = currentMonthRentPaid >= lease.rentAmount;
        let lastMonthBalance = Math.max(0, lease.rentAmount - lastMonthRentPaid);
        let lastMonthIsPaid = lastMonthRentPaid >= lease.rentAmount;

        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const iterMonth = new Date(leaseStart.getFullYear(), leaseStart.getMonth(), 1);
        while (iterMonth <= thisMonthStart) {
          const iterEnd = new Date(iterMonth.getFullYear(), iterMonth.getMonth() + 1, 1);
          const monthRentPaid = payments
            .filter(p => (p as any).paymentType === 'rent')
            .filter(p => { const d = new Date(p.paymentDate); return d >= iterMonth && d < iterEnd; })
            .reduce((s, p) => s + p.amount, 0);
          const effective = monthRentPaid + credit;
          if (effective >= lease.rentAmount) {
            credit = effective - lease.rentAmount;
            if (iterMonth.getTime() === lastMonthStart.getTime()) { lastMonthBalance = 0; lastMonthIsPaid = true; }
            if (iterMonth.getTime() === thisMonthStart.getTime()) { currentMonthBalance = 0; currentMonthIsPaid = true; }
          } else {
            const shortfall = lease.rentAmount - effective;
            totalBalance += shortfall;
            credit = 0;
            if (iterMonth.getTime() === lastMonthStart.getTime()) { lastMonthBalance = shortfall; lastMonthIsPaid = false; }
            if (iterMonth.getTime() === thisMonthStart.getTime()) { currentMonthBalance = shortfall; currentMonthIsPaid = false; }
          }
          iterMonth.setMonth(iterMonth.getMonth() + 1);
        }

        this.leasePaymentData.set(leaseId, {
          currentMonth: {
            due: lease.rentAmount,
            paid: currentMonthRentPaid,
            balance: currentMonthBalance,
            isPaid: currentMonthIsPaid,
            payments: currentMonthPayments,
          },
          lastMonth: {
            due: lease.rentAmount,
            paid: lastMonthRentPaid,
            balance: lastMonthBalance,
            isPaid: lastMonthIsPaid,
            payments: lastMonthPayments,
          },
          totalPaid,
          totalBalance,
          totalPayments: payments.length,
          advanceCredit: credit,
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
    // Capture leaseId BEFORE closing (closePaymentForm nulls selectedLeaseForPayment)
    const leaseId = this.selectedLeaseForPayment?._id;
    this.closePaymentForm();
    if (leaseId) {
      this.leasePaymentData.delete(leaseId);
      this.loadLeasePaymentData(leaseId);
    }
  }
}
