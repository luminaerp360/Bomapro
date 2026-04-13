import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TenantPortalService } from '../shared/services/tenant-portal.service';
import { TenantPortalAuthService } from '../shared/services/tenant-portal-auth.service';
import { PortalLease, PortalPayment } from '../shared/interfaces/portal.interfaces';
import { StkPushResult } from '../../../shared/components/stk-push/stk-push.component';

@Component({
  selector: 'app-portal-payments',
  templateUrl: './portal-payments.component.html',
  styleUrls: ['./portal-payments.component.scss'],
})
export class PortalPaymentsComponent implements OnInit {
  lease: PortalLease | null = null;
  form: FormGroup;
  leaseLoading = true;
  error = '';
  showStkPush = false;
  stkClientId = '';
  paymentStatus: PortalPayment | null = null;
  confirming = false;

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  currentMonth = this.months[new Date().getMonth()] + ' ' + new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private portalService: TenantPortalService,
    private auth: TenantPortalAuthService,
  ) {
    this.form = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(0|254|\+254)[17]\d{8}$/)]],
      amount: ['', [Validators.required, Validators.min(1)]],
      paymentPeriod: [this.currentMonth, Validators.required],
      notes: [''],
    });
  }

  ngOnInit() {
    const profile = this.auth.getProfile();
    if (profile?.phone) {
      this.form.patchValue({ phoneNumber: profile.phone });
    }

    this.portalService.getLease().subscribe({
      next: (lease) => {
        this.lease = lease;
        this.form.patchValue({ amount: lease.rentAmount });
        this.leaseLoading = false;
      },
      error: () => (this.leaseLoading = false),
    });

    this.portalService.getOrgSettings().subscribe({
      next: (settings) => { this.stkClientId = settings.mpesaClientId || ''; },
      error: () => {},
    });
  }

  openStkPush() {
    if (this.form.invalid || !this.lease) return;
    this.error = '';
    this.showStkPush = true;
  }

  onPaymentSuccess(result: StkPushResult) {
    this.showStkPush = false;
    this.confirming = true;
    const { phoneNumber, amount, paymentPeriod, notes } = this.form.value;

    this.portalService.confirmMpesaPayment({
      leaseId: this.lease!._id,
      amount: Number(amount),
      phoneNumber,
      mpesaReceiptNumber: result.mpesaReceiptNumber,
      checkoutRequestId: result.checkoutRequestId,
      paymentPeriod,
      notes,
    }).subscribe({
      next: (payment) => {
        this.paymentStatus = payment;
        this.confirming = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Payment confirmed but could not be recorded. Please contact support.';
        this.confirming = false;
      },
    });
  }

  onStkCancelled() {
    this.showStkPush = false;
  }

  reset() {
    this.paymentStatus = null;
    this.error = '';
    this.showStkPush = false;
  }
}
