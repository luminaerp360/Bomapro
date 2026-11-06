import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PaymentsService } from '../../../shared/services/payments/payments.service';
import { Payment, RentInvoice } from '../../../shared/interfaces/models';
import { StkPushComponent, StkPushResult } from '../../../shared/components/stk-push/stk-push.component';

@Component({
  selector: 'app-public-invoice-pay',
  standalone: true,
  imports: [CommonModule, FormsModule, StkPushComponent],
  templateUrl: './public-invoice-pay.component.html',
})
export class PublicInvoicePayComponent implements OnInit {
  token = '';
  loading = true;
  error = '';

  invoice: RentInvoice | null = null;
  organization: {
    name: string;
    logoUrl: string;
    contactEmail: string;
    mpesaClientId: string;
  } = {
    name: 'Bomapro Property Management',
    logoUrl: '',
    contactEmail: '',
    mpesaClientId: '',
  };

  paymentTab: 'stk' | 'manual' = 'stk';

  // Form fields
  amount = 0;
  phoneNumber = '';
  manualMethod: 'mpesa' | 'bank_transfer' | 'cheque' | 'cash' = 'mpesa';
  mpesaTransactionId = '';
  bankReference = '';
  chequeNumber = '';
  notes = '';

  submitting = false;
  submitError = '';
  completedPayment: Payment | null = null;

  // STK Push modal
  showStkModal = false;

  constructor(
    private route: ActivatedRoute,
    private paymentsService: PaymentsService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.loading = false;
      this.error = 'Invalid or missing invoice link token.';
      return;
    }
    this.loadInvoice();
  }

  loadInvoice(): void {
    this.loading = true;
    this.error = '';
    this.paymentsService.getPublicInvoice(this.token).subscribe({
      next: (res) => {
        this.invoice = res.invoice;
        if (res.organization) {
          this.organization = res.organization;
        }
        this.amount =
          this.invoice.balanceDue > 0 ? this.invoice.balanceDue : this.invoice.amount;
        this.phoneNumber = this.invoice.propertyTenantPhone || '';
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message ||
          'This invoice link is invalid, tampered with, or no longer active.';
      },
    });
  }

  setFullBalance(): void {
    if (this.invoice) {
      this.amount = this.invoice.balanceDue;
    }
  }

  get remainingAfterPay(): number {
    if (!this.invoice) return 0;
    return Math.max(0, (this.invoice.balanceDue || 0) - (Number(this.amount) || 0));
  }

  openStkPush(): void {
    this.submitError = '';
    if (!this.amount || this.amount <= 0) {
      this.submitError = 'Please enter a valid payment amount.';
      return;
    }
    this.showStkModal = true;
  }

  onStkSuccess(result: StkPushResult): void {
    this.showStkModal = false;
    this.submitting = true;
    this.submitError = '';

    this.paymentsService
      .confirmPublicInvoiceMpesa(this.token, {
        amount: Number(this.amount),
        phoneNumber: this.phoneNumber,
        mpesaReceiptNumber: result.mpesaReceiptNumber,
        checkoutRequestId: result.checkoutRequestId,
        notes: `Paid online via M-Pesa STK Push (${result.mpesaReceiptNumber})`,
      })
      .subscribe({
        next: (res) => {
          this.submitting = false;
          this.completedPayment = res.payment;
          this.invoice = res.invoice;
        },
        error: (err) => {
          this.submitting = false;
          this.submitError =
            err?.error?.message || 'Payment succeeded on M-Pesa, but confirmation encountered an error.';
        },
      });
  }

  submitManualPayment(): void {
    this.submitError = '';
    if (!this.amount || this.amount <= 0) {
      this.submitError = 'Please enter a valid payment amount greater than 0.';
      return;
    }
    if (this.manualMethod === 'mpesa' && !this.mpesaTransactionId.trim()) {
      this.submitError = 'Please enter your M-Pesa confirmation code (e.g. QWE1234567).';
      return;
    }
    if (this.manualMethod === 'bank_transfer' && !this.bankReference.trim()) {
      this.submitError = 'Please enter your bank transfer reference number.';
      return;
    }
    if (this.manualMethod === 'cheque' && !this.chequeNumber.trim()) {
      this.submitError = 'Please enter the cheque number.';
      return;
    }

    this.submitting = true;
    this.paymentsService
      .payPublicInvoiceManual(this.token, {
        amount: Number(this.amount),
        paymentMethod: this.manualMethod,
        mpesaTransactionId: this.mpesaTransactionId.trim().toUpperCase(),
        mpesaPhoneNumber: this.phoneNumber.trim(),
        bankReference: this.bankReference.trim(),
        chequeNumber: this.chequeNumber.trim(),
        notes: this.notes.trim(),
      })
      .subscribe({
        next: (res) => {
          this.submitting = false;
          this.completedPayment = res.payment;
          this.invoice = res.invoice;
        },
        error: (err) => {
          this.submitting = false;
          this.submitError = err?.error?.message || 'Failed to submit payment. Please try again.';
        },
      });
  }

  printPage(): void {
    window.print();
  }

  statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      partial: 'bg-amber-100 text-amber-700 border-amber-200',
      overdue: 'bg-red-100 text-red-700 border-red-200',
      unpaid: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

