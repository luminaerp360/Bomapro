import { Component, OnInit } from '@angular/core';
import { PaymentsService } from '../../shared/services/payments/payments.service';
import { Payment } from '../../shared/interfaces/models';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
})
export class InvoicesComponent implements OnInit {
  payments: Payment[] = [];
  loading = false;
  page = 1;
  limit = 20;
  total = 0;
  search = '';
  statusFilter = '';
  sendingId: string | null = null;
  reminderSendingId: string | null = null;
  successMsg = '';

  constructor(private paymentsService: PaymentsService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.paymentsService.getAll(this.page, this.limit, this.search || undefined, this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.payments = res.data || (res as any).items || (res as any as Payment[]) || [];
        this.total = res.total || (res as any).totalCount || this.payments.length;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onSearchChange() {
    this.page = 1;
    this.load();
  }

  onStatusChange(val: string) {
    this.statusFilter = val;
    this.page = 1;
    this.load();
  }

  resendInvoice(p: Payment) {
    this.sendingId = p._id;
    this.successMsg = '';
    this.paymentsService.resendInvoice(p._id).subscribe({
      next: (r) => {
        this.successMsg = r.message || 'Invoice resent successfully';
        this.sendingId = null;
        setTimeout(() => (this.successMsg = ''), 4000);
      },
      error: () => (this.sendingId = null),
    });
  }

  sendReminder(p: Payment) {
    this.reminderSendingId = p._id;
    this.successMsg = '';
    this.paymentsService.sendReminder(p.propertyTenantId).subscribe({
      next: (r) => {
        this.successMsg = r.message || 'Payment reminder sent';
        this.reminderSendingId = null;
        setTimeout(() => (this.successMsg = ''), 4000);
      },
      error: () => (this.reminderSendingId = null),
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
      partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    };
    return map[status] || 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400';
  }
}
