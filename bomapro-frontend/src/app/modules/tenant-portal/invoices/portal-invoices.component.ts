import { Component, OnInit } from '@angular/core';
import { TenantPortalService } from '../shared/services/tenant-portal.service';
import { PortalPayment } from '../shared/interfaces/portal.interfaces';

@Component({
  selector: 'app-portal-invoices',
  templateUrl: './portal-invoices.component.html',
  styleUrls: ['./portal-invoices.component.scss'],
})
export class PortalInvoicesComponent implements OnInit {
  payments: PortalPayment[] = [];
  loading = true;
  error = '';
  selectedPayment: PortalPayment | null = null;

  get completedTotal(): number {
    return this.payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  constructor(private portalService: TenantPortalService) {}

  ngOnInit() {
    this.portalService.getInvoices().subscribe({
      next: (data) => {
        this.payments = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load invoices.';
        this.loading = false;
      },
    });
  }

  viewReceipt(payment: PortalPayment) {
    this.selectedPayment = payment;
  }

  printReceipt(payment: PortalPayment) {
    const date = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Payment Receipt - ${payment.receiptNumber || ''}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 400px; margin: 40px auto; color: #111; }
  h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
  .sub { text-align: center; font-size: 12px; color: #888; margin-bottom: 24px; }
  .status-icon { text-align: center; font-size: 36px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td { padding: 8px 4px; border-bottom: 1px solid #eee; }
  td:first-child { color: #666; }
  td:last-child { text-align: right; font-weight: 600; }
  .footer { text-align: center; font-size: 11px; color: #aaa; margin-top: 24px; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <h1>Bomapro</h1>
  <p class="sub">Payment Receipt</p>
  <div class="status-icon">${payment.status === 'completed' ? '✅' : '⏳'}</div>
  <table>
    ${payment.receiptNumber ? `<tr><td>Receipt No.</td><td>${payment.receiptNumber}</td></tr>` : ''}
    ${payment.mpesaTransactionId ? `<tr><td>M-Pesa Code</td><td>${payment.mpesaTransactionId}</td></tr>` : ''}
    <tr><td>Amount</td><td>KES ${Number(payment.amount).toLocaleString()}</td></tr>
    <tr><td>Period</td><td>${payment.paymentPeriod || '—'}</td></tr>
    <tr><td>Property</td><td>${payment.propertyName || '—'}</td></tr>
    <tr><td>Method</td><td>${(payment.paymentMethod || '').toUpperCase()}</td></tr>
    ${payment.mpesaPhoneNumber ? `<tr><td>Phone</td><td>${payment.mpesaPhoneNumber}</td></tr>` : ''}
    <tr><td>Date</td><td>${date}</td></tr>
    ${payment.notes ? `<tr><td>Notes</td><td>${payment.notes}</td></tr>` : ''}
  </table>
  <p class="footer">Keep this receipt as proof of payment</p>
</body>
</html>`;
    const win = window.open('', '_blank', 'width=480,height=620');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  }
}
