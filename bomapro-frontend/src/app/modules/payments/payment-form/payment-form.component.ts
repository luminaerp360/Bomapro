import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Payment, PaymentMethod, PaymentType } from '../../../shared/interfaces/models';
import { CreatePaymentDto } from '../../../shared/interfaces/payment.interface';
import { Lease } from '../../../shared/interfaces/models';
import { PaymentsService } from '../../../shared/services/payments/payments.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('300ms ease-in', style({ opacity: 1 }))])]),
    trigger('slideDown', [transition(':enter', [style({ transform: 'translateY(-20px)', opacity: 0 }), animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))])]),
  ],
})
export class PaymentFormComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() lease: Lease | null = null;
  @Input() leaseBalance: number = 0;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Payment>();

  form: Partial<CreatePaymentDto> = this.initializeForm();
  loading = false;
  saving = false;
  submitted = false;

  selectedMonths: string[] = [];

  paymentMethods: PaymentMethod[] = ['mpesa', 'bank_transfer', 'cash', 'cheque', 'card', 'other'];
  paymentTypes: PaymentType[] = ['rent', 'deposit', 'late_fee', 'damage', 'utility', 'other'];

  constructor(
    private paymentsService: PaymentsService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue && this.lease) {
      this.loadLeaseData();
    }
  }

  initializeForm(): Partial<CreatePaymentDto> {
    return {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'mpesa',
      paymentType: 'rent',
      currency: 'KES',
    };
  }

  loadLeaseData(): void {
    if (!this.lease) return;
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    this.selectedMonths = [currentMonth];

    const rentAmount = this.form.paymentType === 'rent'
      ? (this.leaseBalance > 0 ? this.leaseBalance : this.lease.rentAmount)
      : undefined;

    this.form = {
      leaseId: this.lease._id,
      propertyTenantId: this.lease.propertyTenantId,
      propertyId: this.lease.propertyId,
      paymentDate: today.toISOString().split('T')[0],
      paymentMethod: 'mpesa',
      paymentType: 'rent',
      currency: this.lease.currency || 'KES',
      propertyName: this.lease.propertyName,
      propertyTenantName: this.lease.propertyTenantName,
      amount: rentAmount,
      paymentPeriod: this.formatMonthsLabel(this.selectedMonths),
    };
    this.submitted = false;
  }

  onPaymentTypeChange(): void {
    if (!this.lease) return;
    if (this.form.paymentType === 'rent') {
      this.form.amount = this.leaseBalance > 0 ? this.leaseBalance : this.lease.rentAmount;
    } else {
      this.form.amount = undefined;
    }
  }

  get remainingAfterPayment(): number | null {
    if (!this.lease || this.form.paymentType !== 'rent') return null;
    const balance = this.leaseBalance > 0 ? this.leaseBalance : this.lease.rentAmount;
    return Math.max(0, balance - (this.form.amount || 0));
  }

  // ── Month picker ────────────────────────────────────────────────────────
  get availableMonths(): { value: string; label: string }[] {
    const months: { value: string; label: string }[] = [];
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
    if (this.lease && this.form.paymentType === 'rent') {
      const perMonth = this.lease.rentAmount;
      this.form.amount = this.selectedMonths.length === 1 && this.leaseBalance > 0
        ? this.leaseBalance
        : perMonth * this.selectedMonths.length;
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

  closeModal(): void {
    this.close.emit();
  }

  private withCurrentTime(dateStr: string): string {
    if (!dateStr) return dateStr;
    const [y, m, d] = dateStr.split('-').map(Number);
    const now = new Date();
    return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
  }

  onSubmit(): void {
    this.submitted = true;

    if (!this.validateForm()) return;

    this.saving = true;
    const payload = { ...this.form, paymentDate: this.withCurrentTime(this.form.paymentDate ?? '') } as CreatePaymentDto;
    this.paymentsService.create(payload).subscribe({
      next: (payment) => {
        this.saving = false;
        this.save.emit(payment);
        this.closeModal();
        this.form = this.initializeForm();
      },
      error: () => {
        this.saving = false;
      },
    });
  }


  validateForm(): boolean {
    if (!this.form.leaseId) return false;
    if (!this.form.propertyTenantId) return false;
    if (!this.form.propertyId) return false;
    if (!this.form.amount || this.form.amount <= 0) return false;
    if (!this.form.paymentDate) return false;
    if (!this.form.paymentMethod) return false;
    
    if (this.form.paymentMethod === 'mpesa' && !this.form.mpesaPhoneNumber) return false;
    if (this.form.paymentMethod === 'bank_transfer' && !this.form.bankReference) return false;
    if (this.form.paymentMethod === 'cheque' && !this.form.chequeNumber) return false;
    
    return true;
  }

  getLeaseRentAmount(): number {
    return this.lease?.rentAmount || 0;
  }
}
