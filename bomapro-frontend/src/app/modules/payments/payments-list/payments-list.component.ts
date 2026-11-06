import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentsService } from '../../../shared/services/payments/payments.service';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { LeasesService } from '../../../shared/services/leases/leases.service';
import { UnitsService } from '../../../shared/services/units/units.service';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { PropertyFilterService } from '../../../shared/services/property-filter/property-filter.service';
import { Payment, PaymentStatus, PaymentMethod, Property, Lease, RentInvoice } from '../../../shared/interfaces/models';
import { StkPushResult } from '../../../shared/components/stk-push/stk-push.component';

@Component({
  selector: 'app-payments-list',
  templateUrl: './payments-list.component.html',
  styleUrls: ['./payments-list.component.scss'],
})
export class PaymentsListComponent implements OnInit, OnDestroy {
  payments: Payment[] = [];
  loading = true;
  search = '';
  statusFilter = '';
  methodFilter = '';
  page = 1;
  limit = 100; // load more to support client-side filters
  total = 0;
  totalPages = 0;
  statuses: PaymentStatus[] = ['pending', 'completed', 'failed', 'refunded', 'partial'];
  methods: PaymentMethod[] = ['mpesa', 'bank_transfer', 'cash', 'cheque', 'card', 'other'];
  isTenant = false;

  // Client-side filters
  propertyFilter = '';
  tenantFilter = '';
  typeFilter = '';
  datePreset = ''; // '' | 'this_month' | 'last_month' | 'custom'
  dateFrom = '';
  dateTo = '';

  // Data for filter dropdowns
  properties: Property[] = [];

  // Lease search for the record form
  leases: Lease[] = [];
  leaseBalances: Map<string, number> = new Map();
  leaseSearch = '';
  showLeaseDropdown = false;
  selectedLease: Lease | null = null;
  selectedLeaseSchedules: RentInvoice[] = [];
  sendingReceiptId: string | null = null;
  actionFeedback = '';

  // Record payment form
  showForm = false;
  saving = false;
  form: Partial<Payment> = {};
  selectedMonths: string[] = [];  // e.g. ['2026-04', '2026-05']
  private refreshTimer: any = null;
  private filterSub: Subscription | null = null;

  // M-Pesa STK Push
  showStkPush = false;
  mpesaClientId = '';

  constructor(
    private paymentsService: PaymentsService,
    private propertiesService: PropertiesService,
    private leasesService: LeasesService,
    private unitsService: UnitsService,
    private propertyTenantsService: PropertyTenantsService,
    public themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
    private propertyFilterService: PropertyFilterService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isTenant = user?.role === 'tenant';
    this.filterSub = this.propertyFilterService.selectedPropertyId$.subscribe(id => {
      this.propertyFilter = id;
    });
    // Load mpesaClientId from active tenant
    const activeTenantId = this.authService.getActiveTenantId();
    const tenants = this.authService.getTenants();
    const activeTenant: any = tenants.find((t: any) => t._id === activeTenantId) || tenants[0] || null;
    if (activeTenant?.mpesaClientId) this.mpesaClientId = activeTenant.mpesaClientId;

    this.loadPayments();
    if (!this.isTenant) {
      this.loadProperties();
      this.loadLeases();
    }
    // Auto-refresh every 30 seconds
    this.refreshTimer = setInterval(() => {
      this.loadPayments();
      if (!this.isTenant && this.selectedLease) {
        this.loadLeaseBalance(this.selectedLease);
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.filterSub?.unsubscribe();
  }

  loadPayments(): void {
    this.loading = true;
    this.paymentsService.getAll(1, this.limit, this.search || undefined, this.statusFilter || undefined, this.methodFilter || undefined).subscribe({
      next: (res) => {
        if (this.isTenant) {
          const user = this.authService.getUser();
          this.payments = res.data.filter((p: any) => p.tenantId === user?._id || p.propertyTenantId === user?._id);
        } else {
          this.payments = res.data;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadProperties(): void {
    this.propertiesService.getAll(1, 100).subscribe({
      next: (res) => {
        this.properties = res.data || [];
        // Re-enrich if leases already loaded
        this.leases.forEach(lease => {
          if (lease.propertyId && !lease.propertyName) {
            const prop = this.properties.find(p => p._id === lease.propertyId);
            if (prop) lease.propertyName = prop.name;
          }
        });
      },
      error: () => {},
    });
  }

  loadLeases(): void {
    this.leasesService.getAll(1, 100, undefined, 'active').subscribe({
      next: (res) => {
        this.leases = res.data || [];
        this.enrichLeaseNames();
      },
      error: () => {},
    });
  }

  private enrichLeaseNames(): void {
    // Enrich property names from already-loaded properties
    this.leases.forEach(lease => {
      if (lease.propertyId && !lease.propertyName) {
        const prop = this.properties.find(p => p._id === lease.propertyId);
        if (prop) lease.propertyName = prop.name;
      }
    });
    // Batch-fetch missing unit numbers
    const unitIds = [...new Set(this.leases.filter(l => l.unitId && !l.unitNumber).map(l => l.unitId!))];
    unitIds.forEach(id => {
      this.unitsService.getById(id).subscribe({
        next: (unit: any) => {
          this.leases.filter(l => l.unitId === id).forEach(l => l.unitNumber = unit.unitNumber || unit.name || id);
        },
        error: () => {},
      });
    });
    // Batch-fetch missing tenant names
    const tenantIds = [...new Set(this.leases.filter(l => l.propertyTenantId && !l.propertyTenantName).map(l => l.propertyTenantId))];
    tenantIds.forEach(id => {
      this.propertyTenantsService.getById(id).subscribe({
        next: (pt: any) => {
          this.leases.filter(l => l.propertyTenantId === id).forEach(l => l.propertyTenantName = pt.name || id);
        },
        error: () => {},
      });
    });
    // Load balances for all leases
    this.leases.forEach(lease => {
      if (lease._id) this.loadLeaseBalance(lease);
    });
  }

  private loadLeaseBalance(lease: Lease): void {
    this.paymentsService.getLeaseScheduleBalance(lease._id).subscribe({
      next: (res) => {
        this.leaseBalances.set(lease._id, res?.balance ?? 0);
      },
      error: () => {
        this.leaseBalances.set(lease._id, 0);
      },
    });
  }

  getLeaseBalance(leaseId: string): number {
    return this.leaseBalances.get(leaseId) ?? -1;
  }

  get filteredLeaseOptions(): Lease[] {
    if (!this.leaseSearch.trim()) return this.leases.slice(0, 20);
    const q = this.leaseSearch.toLowerCase();
    return this.leases.filter(l =>
      (l.leaseNumber || '').toLowerCase().includes(q) ||
      (l.propertyTenantName || '').toLowerCase().includes(q) ||
      (l.propertyName || '').toLowerCase().includes(q) ||
      (l.unitNumber || '').toLowerCase().includes(q)
    ).slice(0, 20);
  }

  get filteredPayments(): Payment[] {
    let result = this.payments;

    if (this.propertyFilter) {
      result = result.filter(p => p.propertyName === this.propertyFilter || (p as any).propertyId === this.propertyFilter);
    }
    if (this.tenantFilter.trim()) {
      const q = this.tenantFilter.toLowerCase();
      result = result.filter(p => (p.propertyTenantName || '').toLowerCase().includes(q));
    }
    if (this.typeFilter) {
      result = result.filter(p => p.paymentType === this.typeFilter);
    }

    const today = new Date();
    if (this.datePreset === 'this_month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      result = result.filter(p => { const d = new Date(p.paymentDate); return d >= start && d < end; });
    } else if (this.datePreset === 'last_month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 1);
      result = result.filter(p => { const d = new Date(p.paymentDate); return d >= start && d < end; });
    } else if (this.datePreset === 'custom') {
      if (this.dateFrom) result = result.filter(p => new Date(p.paymentDate) >= new Date(this.dateFrom));
      if (this.dateTo) result = result.filter(p => new Date(p.paymentDate) <= new Date(this.dateTo));
    }

    return result;
  }

  get uniquePropertyNames(): string[] {
    return [...new Set(this.payments.map(p => p.propertyName).filter(Boolean))] as string[];
  }

  onSearch(): void { this.page = 1; this.loadPayments(); }
  onFilterChange(): void { this.page = 1; this.loadPayments(); }

  setDatePreset(preset: string): void {
    this.datePreset = this.datePreset === preset ? '' : preset;
    this.dateFrom = '';
    this.dateTo = '';
  }

  clearFilters(): void {
    this.search = '';
    this.statusFilter = '';
    this.methodFilter = '';
    this.propertyFilter = '';
    this.tenantFilter = '';
    this.typeFilter = '';
    this.datePreset = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.page = 1;
    this.loadPayments();
  }

  get hasActiveFilters(): boolean {
    return !!(this.search || this.statusFilter || this.methodFilter || this.propertyFilter ||
      this.tenantFilter || this.typeFilter || this.datePreset);
  }

  selectLease(lease: Lease): void {
    this.selectedLease = lease;
    this.leaseSearch = `${lease.leaseNumber} - ${lease.propertyTenantName || ''} (${lease.unitNumber || lease.propertyName || ''})`;
    this.showLeaseDropdown = false;
    // Default month = current month
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    this.selectedMonths = [currentMonth];
    const baseAmount = this.getRentAmountForForm(lease);
    this.form = {
      ...this.form,
      leaseId: lease._id,
      propertyId: lease.propertyId,
      propertyTenantId: lease.propertyTenantId,
      unitId: lease.unitId,
      unitNumber: lease.unitNumber,
      leaseNumber: lease.leaseNumber,
      propertyName: lease.propertyName,
      propertyTenantName: lease.propertyTenantName,
      currency: lease.currency || 'KES',
      amount: baseAmount,
      paymentPeriod: this.formatMonthsLabel(this.selectedMonths),
    };

    // Load the lease's monthly invoices (rent schedules) so the user can see which months are unpaid/partial/paid
    this.selectedLeaseSchedules = [];
    this.paymentsService.getSchedulesByLease(lease._id).subscribe({
      next: (schedules) => {
        this.selectedLeaseSchedules = schedules || [];
        const firstUnpaid = this.selectedLeaseSchedules.find(
          (s) => s.status !== 'paid' && (s.balanceDue ?? s.amount - (s.paidAmount || 0)) > 0,
        );
        if (firstUnpaid && firstUnpaid.month) {
          this.selectedMonths = [firstUnpaid.month];
          this.form.paymentPeriod = this.formatMonthsLabel(this.selectedMonths);
          if (this.form.paymentType === 'rent') {
            this.form.amount = firstUnpaid.balanceDue || firstUnpaid.amount || baseAmount;
          }
        }
      },
      error: () => {},
    });
  }

  /** Returns the balance if payment type is rent (outstanding balance), otherwise 0 */
  getRentAmountForForm(lease: Lease): number {
    if (this.form.paymentType === 'rent') {
      const bal = this.leaseBalances.get(lease._id);
      return bal !== undefined && bal > 0 ? bal : lease.rentAmount;
    }
    return 0;
  }

  onPaymentTypeChange(): void {
    if (!this.selectedLease) return;
    if (this.form.paymentType === 'rent') {
      this.form.amount = this.getRentAmountForForm(this.selectedLease);
    } else {
      // Non-rent types: clear amount so user enters manually
      this.form.amount = undefined;
    }
  }

  /** Balance that will remain AFTER this payment (only meaningful for rent) */
  get remainingAfterPayment(): number | null {
    if (!this.selectedLease || this.form.paymentType !== 'rent') return null;
    const balance = this.leaseBalances.get(this.selectedLease._id) ?? this.selectedLease.rentAmount;
    return Math.max(0, balance - (this.form.amount || 0));
  }

  // ── Month picker helpers ────────────────────────────────────────────────
  get availableMonths(): { value: string; label: string; status?: string; balanceDue?: number }[] {
    if (this.selectedLeaseSchedules && this.selectedLeaseSchedules.length > 0) {
      return this.selectedLeaseSchedules.slice(0, 12).map((s) => ({
        value: s.month,
        label: s.monthLabel || s.month,
        status: s.status,
        balanceDue: s.balanceDue ?? Math.max(0, s.amount - (s.paidAmount || 0)),
      }));
    }
    const months: { value: string; label: string; status?: string; balanceDue?: number }[] = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  }

  toggleMonth(value: string): void {
    const idx = this.selectedMonths.indexOf(value);
    if (idx >= 0) {
      if (this.selectedMonths.length > 1) this.selectedMonths.splice(idx, 1);
    } else {
      this.selectedMonths.push(value);
      this.selectedMonths.sort();
    }
    this.form.paymentPeriod = this.formatMonthsLabel(this.selectedMonths);
    // Recalculate amount for rent using schedule balances when available
    if (this.selectedLease && this.form.paymentType === 'rent') {
      if (this.selectedLeaseSchedules && this.selectedLeaseSchedules.length > 0) {
        const selectedScheds = this.selectedLeaseSchedules.filter((s) => this.selectedMonths.includes(s.month));
        if (selectedScheds.length > 0) {
          const sumDue = selectedScheds.reduce(
            (sum, s) => sum + ((s.balanceDue ?? Math.max(0, s.amount - (s.paidAmount || 0))) || s.amount),
            0,
          );
          this.form.amount = sumDue > 0 ? sumDue : this.selectedLease.rentAmount * this.selectedMonths.length;
          return;
        }
      }
      const bal = this.leaseBalances.get(this.selectedLease._id);
      const perMonth = this.selectedLease.rentAmount;
      const totalDue = perMonth * this.selectedMonths.length;
      this.form.amount = bal !== undefined && bal > 0 && this.selectedMonths.length === 1 ? bal : totalDue;
    }
  }

  isMonthSelected(value: string): boolean {
    return this.selectedMonths.includes(value);
  }

  private formatMonthsLabel(months: string[]): string {
    return months.map(m => {
      const [y, mo] = m.split('-');
      const d = new Date(+y, +mo - 1, 1);
      return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    }).join(', ');
  }

  clearLeaseSelection(): void {
    this.selectedLease = null;
    this.leaseSearch = '';
    this.form = { paymentDate: this.form.paymentDate, paymentMethod: this.form.paymentMethod, paymentType: this.form.paymentType, currency: 'KES' };
  }

  goToPage(p: number): void { this.page = p; }
  viewPayment(id: string): void { this.router.navigate(['/payments', id]); }

  viewLease(leaseId: string | undefined, event: Event): void {
    event.stopPropagation();
    if (leaseId) {
      this.router.navigate(['/leases', leaseId]);
    }
  }

  goToInvoices(leaseId?: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (leaseId) {
      this.router.navigate(['/invoices'], { queryParams: { leaseId } });
    } else {
      this.router.navigate(['/invoices']);
    }
  }

  resendReceipt(p: Payment, event: Event): void {
    event.stopPropagation();
    this.sendingReceiptId = p._id;
    this.paymentsService.resendInvoice(p._id).subscribe({
      next: (res) => {
        this.sendingReceiptId = null;
        this.actionFeedback = res.message || `Receipt ${p.receiptNumber} emailed to tenant`;
        setTimeout(() => (this.actionFeedback = ''), 4000);
      },
      error: () => {
        this.sendingReceiptId = null;
      },
    });
  }

  openForm(): void {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    this.selectedMonths = [currentMonth];
    this.selectedLeaseSchedules = [];
    this.form = { paymentDate: today.toISOString().split('T')[0], paymentMethod: 'mpesa', paymentType: 'rent', currency: 'KES' };
    this.selectedLease = null;
    this.leaseSearch = '';
    this.showLeaseDropdown = false;
    this.showForm = true;
  }

  private withCurrentTime(dateStr: string): string {
    if (!dateStr) return dateStr;
    const [y, m, d] = dateStr.split('-').map(Number);
    const now = new Date();
    return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
  }

  save(): void {
    if (!this.form.amount || !this.form.leaseId) return;
    this.saving = true;
    const payload = {
      ...this.form,
      selectedMonths: this.selectedMonths,
      paymentDate: this.withCurrentTime(this.form.paymentDate ?? ''),
    };
    this.paymentsService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.loadPayments();
        // Refresh the balance for this lease
        if (this.selectedLease) {
          this.leaseBalances.delete(this.selectedLease._id);
          this.loadLeaseBalance(this.selectedLease);
        }
      },
      error: () => { this.saving = false; },
    });
  }

  getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return map[status] || '';
  }

  openStkPush(): void {
    if (!this.selectedLease || !this.form.amount) return;
    this.showStkPush = true;
  }

  onMainPortalMpesaSuccess(result: StkPushResult): void {
    this.showStkPush = false;
    this.saving = true;
    this.paymentsService.confirmMpesaPayment({
      leaseId: this.selectedLease?._id,
      propertyTenantId: this.selectedLease?.propertyTenantId,
      propertyId: this.selectedLease?.propertyId,
      propertyName: this.selectedLease?.propertyName,
      propertyTenantName: this.selectedLease?.propertyTenantName,
      amount: this.form.amount!,
      phoneNumber: this.form.mpesaPhoneNumber || '',
      mpesaReceiptNumber: result.mpesaReceiptNumber,
      checkoutRequestId: result.checkoutRequestId,
      paymentPeriod: this.form.paymentPeriod,
      paymentType: this.form.paymentType || 'rent',
      notes: this.form.notes,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.loadPayments();
        if (this.selectedLease) {
          this.leaseBalances.delete(this.selectedLease._id);
          this.loadLeaseBalance(this.selectedLease);
        }
      },
      error: () => { this.saving = false; },
    });
  }
}

