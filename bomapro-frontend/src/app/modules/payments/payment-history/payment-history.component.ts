import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment } from '../../../shared/interfaces/models';
import { PaymentsService } from '../../../shared/services/payments/payments.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';

export interface MonthGroup {
  label: string;           // "April 2026"
  monthStart: Date;
  due: number;
  paid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid';
  payments: Payment[];
  expanded: boolean;
}

@Component({
  selector: 'app-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class PaymentHistoryComponent implements OnInit, OnChanges {
  @Input() leaseId: string = '';
  @Input() rentAmount: number = 0;
  @Input() currency: string = 'KES';
  @Input() leaseStart: string = '';

  allPayments: Payment[] = [];
  monthGroups: MonthGroup[] = [];
  loading = true;
  totalPaid = 0;
  totalBalance = 0;

  constructor(
    private paymentsService: PaymentsService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    if (this.leaseId) this.loadPaymentHistory();
  }

  ngOnChanges(): void {
    if (this.leaseId && !this.loading) this.loadPaymentHistory();
  }

  loadPaymentHistory(): void {
    this.loading = true;
    this.paymentsService.getByLease(this.leaseId).subscribe({
      next: (payments) => {
        this.allPayments = payments.sort((a, b) =>
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
        );
        this.buildMonthGroups();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  buildMonthGroups(): void {
    const today = new Date();
    const start = this.leaseStart ? new Date(this.leaseStart) : new Date();
    const groups: MonthGroup[] = [];

    // Walk from lease start month to current month (newest first)
    const iter = new Date(start.getFullYear(), start.getMonth(), 1);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    while (iter <= thisMonthStart) {
      const iterEnd = new Date(iter.getFullYear(), iter.getMonth() + 1, 1);
      const monthPayments = this.allPayments.filter(p => {
        const d = new Date(p.paymentDate);
        return d >= iter && d < iterEnd;
      });
      const paid = monthPayments.reduce((s, p) => s + p.amount, 0);
      const due = this.rentAmount || 0;
      const balance = Math.max(0, due - paid);
      const status: 'paid' | 'partial' | 'unpaid' =
        paid >= due ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

      groups.push({
        label: iter.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        monthStart: new Date(iter),
        due,
        paid,
        balance,
        status,
        payments: monthPayments,
        expanded: false,
      });

      iter.setMonth(iter.getMonth() + 1);
    }

    // Newest first
    this.monthGroups = groups.reverse();
    this.totalPaid = this.allPayments.reduce((s, p) => s + p.amount, 0);
    this.totalBalance = groups.reduce((s, g) => s + g.balance, 0);
  }

  toggle(group: MonthGroup): void {
    group.expanded = !group.expanded;
  }

  getMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      mpesa: 'fa-mobile-alt',
      bank_transfer: 'fa-university',
      cash: 'fa-money-bill',
      cheque: 'fa-file',
      card: 'fa-credit-card',
      other: 'fa-exchange-alt',
    };
    return icons[method] || 'fa-exchange-alt';
  }
}

