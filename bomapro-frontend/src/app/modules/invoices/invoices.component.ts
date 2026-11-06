import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentsService } from '../../shared/services/payments/payments.service';
import { PropertiesService } from '../../shared/services/properties/properties.service';
import { PropertyFilterService } from '../../shared/services/property-filter/property-filter.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { Payment, PaymentMethod, PaymentType, Property, RentInvoice } from '../../shared/interfaces/models';
import { StkPushResult } from '../../shared/components/stk-push/stk-push.component';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
})
export class InvoicesComponent implements OnInit, OnDestroy {
  activeTab: 'invoices' | 'receipts' = 'invoices';

  // Invoices (Rent Schedules)
  invoices: RentInvoice[] = [];
  invoiceStats = {
    totalInvoicedDue: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdueCount: 0,
    overdueAmount: 0,
    unpaidCount: 0,
    paidThisMonthCount: 0,
    paidThisMonthAmount: 0,
  };
  invoiceLoading = false;
  invoicePage = 1;
  invoiceLimit = 50;
  invoiceTotal = 0;
  invoiceTotalPages = 1;
  invoiceSearch = '';
  invoiceStatusFilter = '';
  invoiceScope: 'due' | 'all' = 'due';
  propertyFilter = '';
  leaseFilter = '';

  // Receipts (Payments)
  payments: Payment[] = [];
  receiptsLoading = false;
  receiptPage = 1;
  receiptLimit = 30;
  receiptTotal = 0;
  receiptSearch = '';
  receiptStatusFilter = '';

  properties: Property[] = [];

  // Email & notification state
  sendingInvoiceId: string | null = null;
  sendingReceiptId: string | null = null;
  reminderSendingId: string | null = null;
  successMsg = '';
  errorMsg = '';

  // Record Payment Modal (Directly from an Invoice)
  showPayModal = false;
  payingInvoice: RentInvoice | null = null;
  savingPayment = false;
  payForm: {
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    paymentType: PaymentType;
    mpesaTransactionId: string;
    mpesaPhoneNumber: string;
    bankReference: string;
    chequeNumber: string;
    notes: string;
  } = {
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'mpesa',
    paymentType: 'rent',
    mpesaTransactionId: '',
    mpesaPhoneNumber: '',
    bankReference: '',
    chequeNumber: '',
    notes: '',
  };

  // M-Pesa STK Push
  showStkPush = false;
  mpesaClientId = '';

  // Printable Invoice / Receipt Preview Modal
  previewInvoice: RentInvoice | null = null;
  previewReceipt: Payment | null = null;

  private filterSub: Subscription | null = null;
  private querySub: Subscription | null = null;

  constructor(
    private paymentsService: PaymentsService,
    private propertiesService: PropertiesService,
    private propertyFilterService: PropertyFilterService,
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const activeTenantId = this.authService.getActiveTenantId();
    const tenants = this.authService.getTenants();
    const activeTenant: any = tenants.find((t: any) => t._id === activeTenantId) || tenants[0] || null;
    if (activeTenant?.mpesaClientId) {
      this.mpesaClientId = activeTenant.mpesaClientId;
    }

    this.loadProperties();

    this.querySub = this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'receipts') {
        this.activeTab = 'receipts';
      } else if (params['tab'] === 'invoices') {
        this.activeTab = 'invoices';
      }
      if (params['leaseId']) {
        this.leaseFilter = params['leaseId'];
      }
      if (params['status']) {
        this.invoiceStatusFilter = params['status'];
      }
      this.loadInvoices();
      this.loadReceipts();
    });

    this.filterSub = this.propertyFilterService.selectedPropertyId$.subscribe((propId) => {
      if (this.propertyFilter !== propId) {
        this.propertyFilter = propId || '';
        this.invoicePage = 1;
        this.loadInvoices();
      }
    });
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
    this.querySub?.unsubscribe();
  }

  loadProperties(): void {
    this.propertiesService.getAll(1, 100).subscribe({
      next: (res) => {
        this.properties = res.data || [];
      },
      error: () => {},
    });
  }

  setTab(tab: 'invoices' | 'receipts'): void {
    this.activeTab = tab;
    if (tab === 'invoices') {
      this.loadInvoices();
    } else {
      this.loadReceipts();
    }
  }

  setScope(scope: 'due' | 'all'): void {
    this.invoiceScope = scope;
    this.invoicePage = 1;
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.invoiceLoading = true;
    this.paymentsService
      .getInvoices({
        page: this.invoicePage,
        limit: this.invoiceLimit,
        search: this.invoiceSearch || undefined,
        status: this.invoiceStatusFilter || undefined,
        propertyId: this.propertyFilter || undefined,
        leaseId: this.leaseFilter || undefined,
        scope: this.invoiceScope,
      })
      .subscribe({
        next: (res) => {
          this.invoices = res.data || [];
          this.invoiceTotal = res.total || 0;
          this.invoiceTotalPages = res.totalPages || 1;
          if (res.stats) {
            this.invoiceStats = res.stats;
          }
          this.invoiceLoading = false;
        },
        error: () => {
          this.invoiceLoading = false;
        },
      });
  }

  loadReceipts(): void {
    this.receiptsLoading = true;
    this.paymentsService
      .getAll(
        this.receiptPage,
        this.receiptLimit,
        this.receiptSearch || undefined,
        this.receiptStatusFilter || undefined,
      )
      .subscribe({
        next: (res) => {
          let list = res.data || (res as any).items || [];
          if (this.propertyFilter) {
            list = list.filter(
              (p: Payment) => p.propertyId === this.propertyFilter || p.propertyName === this.propertyFilter,
            );
          }
          if (this.leaseFilter) {
            list = list.filter((p: Payment) => p.leaseId === this.leaseFilter);
          }
          this.payments = list;
          this.receiptTotal = res.total || this.payments.length;
          this.receiptsLoading = false;
        },
        error: () => {
          this.receiptsLoading = false;
        },
      });
  }

  onInvoiceFilterChange(): void {
    this.invoicePage = 1;
    this.loadInvoices();
  }

  clearInvoiceFilters(): void {
    this.invoiceSearch = '';
    this.invoiceStatusFilter = '';
    this.propertyFilter = '';
    this.leaseFilter = '';
    this.invoicePage = 1;
    this.loadInvoices();
    this.loadReceipts();
  }

  onReceiptSearchChange(): void {
    this.receiptPage = 1;
    this.loadReceipts();
  }

  onReceiptStatusChange(val: string): void {
    this.receiptStatusFilter = val;
    this.receiptPage = 1;
    this.loadReceipts();
  }

  // ── Direct Payment from an Invoice ──────────────────────────────────────
  openPayInvoiceModal(inv: RentInvoice): void {
    this.payingInvoice = inv;
    this.payForm = {
      amount: inv.balanceDue > 0 ? inv.balanceDue : inv.amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'mpesa',
      paymentType: 'rent',
      mpesaTransactionId: '',
      mpesaPhoneNumber: inv.propertyTenantPhone || '',
      bankReference: '',
      chequeNumber: '',
      notes: `Payment for ${inv.invoiceNumber} (${inv.monthLabel || inv.month})`,
    };
    this.showPayModal = true;
  }

  closePayModal(): void {
    this.showPayModal = false;
    this.payingInvoice = null;
  }

  get remainingOnInvoiceAfterPay(): number {
    if (!this.payingInvoice) return 0;
    return Math.max(0, (this.payingInvoice.balanceDue || 0) - (Number(this.payForm.amount) || 0));
  }

  private withCurrentTime(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();
    const [y, m, d] = dateStr.split('-').map(Number);
    const now = new Date();
    return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
  }

  submitInvoicePayment(): void {
    if (!this.payingInvoice || !this.payForm.amount || this.payForm.amount <= 0) return;
    this.savingPayment = true;
    const inv = this.payingInvoice;

    const payload: Partial<Payment> = {
      leaseId: inv.leaseId,
      propertyTenantId: inv.propertyTenantId || '',
      propertyId: inv.propertyId,
      unitId: inv.unitId,
      unitNumber: inv.unitNumber || '',
      leaseNumber: inv.leaseNumber || '',
      propertyName: inv.propertyName || '',
      propertyTenantName: inv.propertyTenantName || '',
      scheduleId: inv._id,
      selectedMonths: inv.month ? [inv.month] : [],
      paymentPeriod: inv.monthLabel || inv.month,
      amount: Number(this.payForm.amount),
      currency: inv.currency || 'KES',
      paymentDate: this.withCurrentTime(this.payForm.paymentDate),
      paymentMethod: this.payForm.paymentMethod,
      paymentType: this.payForm.paymentType,
      mpesaTransactionId: this.payForm.mpesaTransactionId,
      mpesaPhoneNumber: this.payForm.mpesaPhoneNumber,
      bankReference: this.payForm.bankReference,
      chequeNumber: this.payForm.chequeNumber,
      notes: this.payForm.notes,
    };

    this.paymentsService.create(payload).subscribe({
      next: (createdPayment) => {
        this.savingPayment = false;
        this.showPayModal = false;
        this.payingInvoice = null;
        this.showSuccess(`Payment recorded (${createdPayment.receiptNumber}) and invoice updated!`);
        this.loadInvoices();
        this.loadReceipts();
      },
      error: (err) => {
        this.savingPayment = false;
        this.showError(err?.error?.message || 'Failed to record payment');
      },
    });
  }

  openStkPushForInvoice(): void {
    if (!this.payingInvoice || !this.payForm.amount) return;
    this.showStkPush = true;
  }

  onInvoiceMpesaSuccess(result: StkPushResult): void {
    this.showStkPush = false;
    if (!this.payingInvoice) return;
    const inv = this.payingInvoice;
    this.savingPayment = true;

    this.paymentsService
      .confirmMpesaPayment({
        leaseId: inv.leaseId,
        propertyTenantId: inv.propertyTenantId,
        propertyId: inv.propertyId,
        propertyName: inv.propertyName,
        propertyTenantName: inv.propertyTenantName,
        amount: Number(this.payForm.amount),
        phoneNumber: this.payForm.mpesaPhoneNumber || inv.propertyTenantPhone || '',
        mpesaReceiptNumber: result.mpesaReceiptNumber,
        checkoutRequestId: result.checkoutRequestId,
        paymentPeriod: inv.monthLabel || inv.month,
        paymentType: 'rent',
        notes: this.payForm.notes,
      } as any)
      .subscribe({
        next: (created) => {
          this.savingPayment = false;
          this.showPayModal = false;
          this.payingInvoice = null;
          this.showSuccess(`M-Pesa payment confirmed (${created.receiptNumber})!`);
          this.loadInvoices();
          this.loadReceipts();
        },
        error: () => {
          this.savingPayment = false;
          this.showError('Failed to confirm M-Pesa payment');
        },
      });
  }

  // ── Email Actions ───────────────────────────────────────────────────────
  sendInvoiceEmail(inv: RentInvoice): void {
    this.sendingInvoiceId = inv._id;
    this.paymentsService.sendInvoiceEmail(inv._id).subscribe({
      next: (res) => {
        this.sendingInvoiceId = null;
        this.showSuccess(res.message || 'Invoice sent to tenant email');
      },
      error: (err) => {
        this.sendingInvoiceId = null;
        this.showError(err?.error?.message || 'Could not send invoice email (check tenant email & SMTP settings)');
      },
    });
  }

  resendReceipt(p: Payment): void {
    this.sendingReceiptId = p._id;
    this.paymentsService.resendInvoice(p._id).subscribe({
      next: (r) => {
        this.sendingReceiptId = null;
        this.showSuccess(r.message || 'Receipt sent to tenant email');
      },
      error: (err) => {
        this.sendingReceiptId = null;
        this.showError(err?.error?.message || 'Could not send receipt email');
      },
    });
  }

  sendReminder(propertyTenantId?: string, rowId?: string): void {
    if (!propertyTenantId) return;
    this.reminderSendingId = rowId || propertyTenantId;
    this.paymentsService.sendReminder(propertyTenantId).subscribe({
      next: (r) => {
        this.reminderSendingId = null;
        this.showSuccess(r.message || 'Payment reminder sent');
      },
      error: (err) => {
        this.reminderSendingId = null;
        this.showError(err?.error?.message || 'Could not send reminder email');
      },
    });
  }

  // ── Preview & Print Modals ──────────────────────────────────────────────
  openInvoicePreview(inv: RentInvoice): void {
    this.previewInvoice = inv;
  }

  openReceiptPreview(p: Payment): void {
    this.previewReceipt = p;
  }

  printDocument(): void {
    window.print();
  }

  // ── Cross-module Navigation ─────────────────────────────────────────────
  viewLease(leaseId?: string): void {
    if (leaseId) {
      this.router.navigate(['/leases', leaseId]);
    }
  }

  viewPaymentDetail(paymentId?: string): void {
    if (paymentId) {
      this.router.navigate(['/payments', paymentId]);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  private showSuccess(msg: string): void {
    this.successMsg = msg;
    this.errorMsg = '';
    setTimeout(() => (this.successMsg = ''), 4500);
  }

  private showError(msg: string): void {
    this.errorMsg = msg;
    this.successMsg = '';
    setTimeout(() => (this.errorMsg = ''), 5000);
  }

  invoiceStatusClass(status: string): string {
    const map: Record<string, string> = {
      paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
      unpaid: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    };
    return map[status] || 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400';
  }

  receiptStatusClass(status: string): string {
    const map: Record<string, string> = {
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
      partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    };
    return map[status] || 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400';
  }
}
