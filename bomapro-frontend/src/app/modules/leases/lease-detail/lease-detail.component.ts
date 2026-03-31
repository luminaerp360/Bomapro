import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeasesService } from '../../../shared/services/leases/leases.service';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { UnitsService } from '../../../shared/services/units/units.service';
import { PaymentsService } from '../../../shared/services/payments/payments.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { Lease, Payment } from '../../../shared/interfaces/models';
import { PaymentFormComponent } from '../../payments/payment-form/payment-form.component';
import { PaymentHistoryComponent } from '../../payments/payment-history/payment-history.component';

interface DelinquentPayment {
  dueDate: Date;
  overdue: boolean;
  daysOverdue: number;
}

interface MonthlyPaymentBreakdown {
  month: Date;
  expectedAmount: number;
  paidAmount: number;
  previousBalance: number;
  currentBalance: number;
  paymentStatus: 'paid' | 'partially-paid' | 'unpaid';
}

@Component({
  selector: 'app-lease-detail',
  templateUrl: './lease-detail.component.html',
  styleUrls: ['./lease-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaymentFormComponent, PaymentHistoryComponent],
})
export class LeaseDetailComponent implements OnInit {
  lease: Lease | null = null;
  payments: Payment[] = [];
  loading = true;
  showTerminate = false;
  terminationReason = '';
  nextPaymentDue: Date | null = null;
  paymentSchedule: Date[] = [];
  leaseTimeline: any[] = [];
  showPaymentForm = false;
  showEditLease = false;
  editForm: Partial<Lease> = {};
  showDocuments = false;
  delinquentPayments: DelinquentPayment[] = [];
  monthlyBreakdown: MonthlyPaymentBreakdown[] = [];
  showEditPayment = false;
  editingPayment: any = null;
  showCurrentMonthBreakdown = false;
  activeTab: 'details' | 'financial' | 'payments' = 'details';
  paymentMetrics: any = {
    totalCollected: 0,
    totalExpected: 0,
    collectionRate: 0,
    overdueAmount: 0,
    lastPaymentDate: null
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private leasesService: LeasesService,
    private propertiesService: PropertiesService,
    private propertyTenantsService: PropertyTenantsService,
    private unitsService: UnitsService,
    private paymentsService: PaymentsService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string): void {
    this.leasesService.getById(id).subscribe({
      next: (l) => {
        this.lease = l;
        this.editForm = { ...l };
        this.calculateNextPaymentDue();
        this.generatePaymentSchedule();
        this.generateLeaseTimeline();
        this.loading = false;
        this.paymentsService.getByLease(id).subscribe((p) => {
          this.payments = p || [];
          this.calculatePaymentMetrics();
          this.calculateDepositStatus();
          this.identifyDelinquentPayments();
          this.generateMonthlyBreakdown();
        });
        
        // Load property name
        if (this.lease.propertyId) {
          this.propertiesService.getById(this.lease.propertyId).subscribe({
            next: (property) => {
              if (this.lease) {
                this.lease.propertyName = property.name;
              }
            },
            error: (err) => console.error('Error loading property:', err),
          });
        }
        
        // Load tenant name
        if (this.lease.propertyTenantId) {
          this.propertyTenantsService.getById(this.lease.propertyTenantId).subscribe({
            next: (tenant) => {
              if (this.lease) {
                this.lease.propertyTenantName = tenant.name;
              }
            },
            error: (err) => console.error('Error loading tenant:', err),
          });
        }
        
        // Load unit number
        if (this.lease.unitId) {
          this.unitsService.getById(this.lease.unitId).subscribe({
            next: (unit) => {
              if (this.lease) {
                this.lease.unitNumber = unit.unitNumber;
              }
            },
            error: (err) => console.error('Error loading unit:', err),
          });
        }
      },
      error: () => { this.loading = false; },
    });
  }

  calculateNextPaymentDue(): void {
    if (this.lease) {
      this.nextPaymentDue = this.leasesService.calculateNextPaymentDueDate(this.lease);
    }
  }

  generatePaymentSchedule(): void {
    if (this.lease) {
      this.paymentSchedule = this.leasesService.calculatePaymentSchedule(this.lease, 12);
    }
  }

  generateLeaseTimeline(): void {
    if (!this.lease) return;

    const timelineEvents = [
      {
        date: this.lease.createdAt,
        event: 'Lease Created',
        icon: 'fa-file-contract',
        status: 'completed',
        type: 'lease'
      },
      {
        date: this.lease.startDate,
        event: 'Lease Starts',
        icon: 'fa-play-circle',
        status: new Date() >= new Date(this.lease.startDate || '') ? 'completed' : 'pending',
        type: 'lease'
      },
      {
        date: this.lease.endDate,
        event: 'Lease Ends',
        icon: 'fa-stop-circle',
        status: new Date() >= new Date(this.lease.endDate || '') ? 'completed' : 'pending',
        type: 'lease'
      },
      ...(this.lease.terminatedAt ? [{
        date: this.lease.terminatedAt,
        event: `Terminated - ${this.lease.terminationReason || 'No reason specified'}`,
        icon: 'fa-times-circle',
        status: 'completed',
        type: 'lease'
      }] : []),
      // Add payment milestones
      ...(this.payments && this.payments.length > 0 ? 
        this.payments.slice(0, 5).map(p => ({
          date: p.paymentDate,
          event: `Payment Received - ${this.lease?.currency} ${p.amount}`,
          icon: 'fa-check-circle',
          status: p.status === 'completed' ? 'completed' : 'pending',
          type: 'payment'
        })) : [])
    ].sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());

    this.leaseTimeline = timelineEvents;
  }

  renewLease(): void {
    if (!this.lease || !this.lease.endDate || !confirm('Create renewal lease?')) return;

    const startDate = new Date(this.lease.endDate);
    startDate.setDate(startDate.getDate() + 1);

    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const renewalData: Partial<Lease> = {
      tenantId: this.lease.tenantId,
      propertyId: this.lease.propertyId,
      unitId: this.lease.unitId,
      propertyTenantId: this.lease.propertyTenantId,
      status: 'draft',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      rentAmount: this.lease.rentAmount,
      currency: this.lease.currency,
      depositAmount: this.lease.depositAmount,
      depositPaid: false,
      paymentFrequency: this.lease.paymentFrequency,
      paymentDueDay: this.lease.paymentDueDay,
      terms: this.lease.terms,
      renewedFromLeaseId: this.lease._id,
      propertyTenantName: this.lease.propertyTenantName,
      propertyName: this.lease.propertyName,
    };

    this.leasesService.create(renewalData).subscribe({
      next: () => {
        alert('Renewal lease created. Activate it to begin the new term.');
        this.router.navigate(['/leases']);
      },
      error: () => alert('Failed to create renewal lease'),
    });
  }

  getDaysUntilExpiry(): number {
    if (!this.lease || !this.lease.endDate) return -1;
    const today = new Date();
    const end = new Date(this.lease.endDate);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  isLeaseExpiring(): boolean {
    const days = this.getDaysUntilExpiry();
    return days > 0 && days <= 30;
  }

  canRenew(): boolean {
    return this.lease?.status === 'active' && this.isLeaseExpiring();
  }

  canActivate(): boolean {
    return this.lease?.status === 'draft';
  }

  openPaymentForm(): void {
    this.showPaymentForm = true;
  }

  closePaymentForm(): void {
    this.showPaymentForm = false;
  }

  onPaymentSaved(payment: Payment): void {
    if (!this.lease) return;
    
    // Reload payments from server to get fresh data
    this.paymentsService.getByLease(this.lease._id).subscribe({
      next: (payments) => {
        this.payments = payments || [];
        this.calculatePaymentMetrics();
        this.calculateDepositStatus();
        this.identifyDelinquentPayments();
        this.generateMonthlyBreakdown();
        this.generateLeaseTimeline();
        
        // Show current month breakdown
        this.showCurrentMonthBreakdown = true;
        
        alert('Payment recorded successfully! New balance calculated below.');
      },
      error: () => alert('Payment saved but failed to refresh data'),
    });
  }

  canTerminate(): boolean {
    return ['active', 'draft'].includes(this.lease?.status || '');
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

  goBack(): void { this.router.navigate(['/leases']); }

  activate(): void {
    if (!this.lease) return;
    this.leasesService.activate(this.lease._id).subscribe((l) => (this.lease = l));
  }

  terminate(): void {
    if (!this.lease || !this.terminationReason) return;
    this.leasesService.terminate(this.lease._id, this.terminationReason).subscribe((l) => {
      this.lease = l;
      this.showTerminate = false;
      this.generateLeaseTimeline();
    });
  }

  deleteLease(): void {
    if (!this.lease || !confirm('Delete this lease?')) return;
    this.leasesService.delete(this.lease._id).subscribe(() => this.goBack());
  }

  openEditLease(): void {
    this.editForm = { ...this.lease };
    this.showEditLease = true;
  }

  closeEditLease(): void {
    this.showEditLease = false;
  }

  saveLease(): void {
    if (!this.lease) return;
    this.leasesService.update(this.lease._id, this.editForm).subscribe({
      next: (updated) => {
        this.lease = updated;
        this.editForm = { ...updated };
        this.showEditLease = false;
        alert('Lease updated successfully!');
      },
      error: () => alert('Failed to update lease'),
    });
  }

  calculatePaymentMetrics(): void {
    if (!this.lease || !this.payments) return;

    // Only count rent payments for collection rate (exclude deposits, damages, utilities, etc)
    const completedRentPayments = this.payments.filter(p => p.status === 'completed' && p.paymentType === 'rent');
    const totalRentCollected = completedRentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate expected rent payments based on lease duration and frequency
    const today = new Date();
    const start = new Date(this.lease.startDate || '');
    const end = new Date(Math.min(today.getTime(), new Date(this.lease.endDate || '').getTime()));

    let monthsDuration = 0;
    let d = new Date(start);
    while (d < end) {
      monthsDuration++;
      d.setMonth(d.getMonth() + 1);
    }

    const frequency = this.lease.paymentFrequency === 'monthly' ? 1 :
                     this.lease.paymentFrequency === 'quarterly' ? 3 :
                     this.lease.paymentFrequency === 'semi_annually' ? 6 : 12;

    this.paymentMetrics.totalExpected = Math.floor(monthsDuration / frequency) * this.lease.rentAmount;
    
    // Cap collection rate at 100% - only rent payments count
    let collectionRate = this.paymentMetrics.totalExpected > 0 
      ? (totalRentCollected / this.paymentMetrics.totalExpected) * 100
      : 0;
    this.paymentMetrics.collectionRate = Math.min(collectionRate, 100).toFixed(1);
    this.paymentMetrics.totalCollected = totalRentCollected;

    if (completedRentPayments.length > 0) {
      this.paymentMetrics.lastPaymentDate = completedRentPayments[0].paymentDate;
    }
  }

  calculateDepositStatus(): void {
    if (!this.lease || !this.payments) return;

    // Check for completed deposit payments
    const depositPayments = this.payments.filter(p => p.status === 'completed' && p.paymentType === 'deposit');
    const totalDepositPaid = depositPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Mark deposit as paid if total deposit paid >= required amount
    if (this.lease) {
      this.lease.depositPaid = totalDepositPaid >= (this.lease.depositAmount || 0);
    }
  }

  identifyDelinquentPayments(): void {
    const today = new Date();
    const gracePeriodMs = (this.lease?.gracePeriodDays || 5) * 24 * 60 * 60 * 1000;

    this.delinquentPayments = this.paymentSchedule
      .map(dueDate => ({
        dueDate,
        overdue: (today.getTime() - new Date(dueDate).getTime()) > gracePeriodMs,
        daysOverdue: Math.floor((today.getTime() - (new Date(dueDate).getTime() + gracePeriodMs)) / (24 * 60 * 60 * 1000))
      }))
      .filter(item => item.overdue && item.daysOverdue > 0);

    // Calculate total overdue amount
    this.paymentMetrics.overdueAmount = this.delinquentPayments.length * (this.lease?.rentAmount || 0);
  }

  generateMonthlyBreakdown(): void {
    if (!this.lease || !this.payments) return;

    const breakdown: MonthlyPaymentBreakdown[] = [];
    let previousBalance = 0;
    const start = new Date(this.lease.startDate || '');
    const end = new Date(this.lease.endDate || '');
    const frequency = this.lease.paymentFrequency === 'monthly' ? 1 :
                     this.lease.paymentFrequency === 'quarterly' ? 3 :
                     this.lease.paymentFrequency === 'semi_annually' ? 6 : 12;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentMonth = new Date(start);
    while (currentMonth <= end) {
      const monthStart = new Date(currentMonth);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(currentMonth);
      monthEnd.setMonth(monthEnd.getMonth() + frequency);
      monthEnd.setHours(23, 59, 59, 999);

      // Get rent payments for this month (only rent type)
      const monthPayments = this.payments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        return p.status === 'completed' && 
               p.paymentType === 'rent' && 
               paymentDate >= monthStart && 
               paymentDate < monthEnd;
      });

      const paidAmount = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const expectedAmount = this.lease.rentAmount;
      
      // Show all past/current months and future months with carryforward balance or payments
      const isMonthInPastOrCurrent = monthStart <= today;
      const hasCarryforwardBalance = previousBalance !== 0;
      const hasPaymentActivity = paidAmount > 0;
      
      if (isMonthInPastOrCurrent || hasCarryforwardBalance || hasPaymentActivity) {
        const currentBalance = previousBalance + expectedAmount - paidAmount;
        
        breakdown.push({
          month: monthStart,
          expectedAmount,
          paidAmount,
          previousBalance,
          currentBalance,
          paymentStatus: currentBalance <= 0 ? 'paid' : 
                        (paidAmount > 0 || previousBalance < 0) ? 'partially-paid' : 'unpaid'
        });

        previousBalance = currentBalance; // Carry forward for next iteration
      }

      currentMonth.setMonth(currentMonth.getMonth() + frequency);
    }

    this.monthlyBreakdown = breakdown;
  }

  openEditPayment(payment: any): void {
    this.editingPayment = { ...payment };
    this.showEditPayment = true;
  }

  closeEditPayment(): void {
    this.showEditPayment = false;
    this.editingPayment = null;
  }

  savePaymentEdit(): void {
    if (!this.editingPayment) return;
    this.paymentsService.update(this.editingPayment._id, this.editingPayment).subscribe({
      next: (updated) => {
        const index = this.payments.findIndex(p => p._id === updated._id);
        if (index !== -1) {
          this.payments[index] = updated;
        }
        this.calculatePaymentMetrics();
        this.calculateDepositStatus();
        this.identifyDelinquentPayments();
        this.generateMonthlyBreakdown();
        this.generateLeaseTimeline();
        this.showEditPayment = false;
        this.editingPayment = null;
        alert('Payment updated successfully!');
      },
      error: () => alert('Failed to update payment'),
    });
  }

  deletePayment(paymentId: string): void {
    if (!confirm('Delete this payment? This action cannot be undone.')) return;
    this.paymentsService.delete(paymentId).subscribe({
      next: () => {
        this.payments = this.payments.filter(p => p._id !== paymentId);
        this.calculatePaymentMetrics();
        this.calculateDepositStatus();
        this.identifyDelinquentPayments();
        this.generateMonthlyBreakdown();
        this.generateLeaseTimeline();
        alert('Payment deleted successfully!');
      },
      error: () => alert('Failed to delete payment'),
    });
  }

  downloadLeaseExport(): void {
    if (!this.lease) return;

    const summary = `
LEASE SUMMARY
=============
Lease Number: ${this.lease.leaseNumber}
Status: ${this.lease.status}

PARTIES
Property: ${this.lease.propertyName}
Tenant: ${this.lease.propertyTenantName}
Unit: ${this.lease.unitNumber}

LEASE TERMS
Start Date: ${new Date(this.lease.startDate || '').toLocaleDateString()}
End Date: ${new Date(this.lease.endDate || '').toLocaleDateString()}
Duration: ${this.getDaysUntilExpiry() > 0 ? 'Active' : 'Expired'}

FINANCIAL DETAILS
Monthly Rent: ${this.lease.currency} ${(this.lease.rentAmount || 0).toLocaleString()}
Deposit Amount: ${this.lease.currency} ${(this.lease.depositAmount || 0).toLocaleString()}
Deposit Paid: ${this.lease.depositPaid ? 'Yes' : 'No'}
Payment Frequency: ${this.lease.paymentFrequency}
Payment Due Day: ${this.lease.paymentDueDay}
Late Fee: ${this.lease.currency} ${(this.lease.lateFeeAmount || 0).toLocaleString()}
Grace Period: ${this.lease.gracePeriodDays} days

PAYMENT METRICS
Total Collected: ${this.lease.currency} ${this.paymentMetrics.totalCollected.toLocaleString()}
Total Expected: ${this.lease.currency} ${this.paymentMetrics.totalExpected.toLocaleString()}
Collection Rate: ${this.paymentMetrics.collectionRate}%
Overdue Amount: ${this.lease.currency} ${this.paymentMetrics.overdueAmount.toLocaleString()}
Total Payments: ${this.payments.length}

${this.lease.terms ? `\nTERMS\n${this.lease.terms}` : ''}

Generated: ${new Date().toLocaleString()}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(summary));
    element.setAttribute('download', `Lease_${this.lease.leaseNumber}_Summary.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
