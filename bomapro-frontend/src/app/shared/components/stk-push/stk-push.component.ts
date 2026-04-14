import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { MpesaService } from '../../services/mpesa/mpesa.service';

export type StkPushState = 'idle' | 'sending' | 'checking' | 'success' | 'failed';

export interface StkPushResult {
  success: true;
  mpesaReceiptNumber: string;
  transactionId: string;
  checkoutRequestId: string;
}

@Component({
  standalone: true,
  selector: 'app-stk-push',
  imports: [CommonModule, FormsModule],
  template: `
<!-- Backdrop -->
<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60"
     (click)="onBackdropClick($event)">
  <div class="bg-white dark:bg-slate-800 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transition-colors"
       (click)="$event.stopPropagation()">

    <!-- Green header -->
    <div class="bg-gradient-to-r from-green-600 to-green-700 px-5 py-5 text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <i class="fas fa-mobile-alt text-lg"></i>
          </div>
          <div>
            <div class="font-bold text-base leading-tight">M-Pesa Payment</div>
            <div class="text-green-100 text-xs mt-0.5">Secure Lipa Na M-Pesa</div>
          </div>
        </div>
        <button (click)="cancel()" class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg leading-none transition-colors">
          &times;
        </button>
      </div>
      <!-- Amount -->
      <div class="mt-4 bg-white/10 rounded-xl px-4 py-3">
        <div class="text-green-100 text-xs mb-0.5">Amount to pay</div>
        <div class="text-2xl font-bold">{{ formatCurrency(amount) }}</div>
        <div class="text-green-100 text-xs mt-0.5 truncate">{{ description }}</div>
        <div *ngIf="unitNumber" class="text-green-100 text-xs mt-0.5">Unit: {{ unitNumber }}</div>
      </div>
    </div>

    <!-- Body -->
    <div class="px-5 py-5">

      <!-- State: idle — phone input -->
      <ng-container *ngIf="state === 'idle'">
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Enter the M-Pesa registered phone number to receive the payment prompt.
        </p>
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Phone Number <span class="text-red-500">*</span>
          </label>
          <input
            type="tel"
            [(ngModel)]="phoneInput"
            placeholder="e.g. 0712345678"
            class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-sm outline-none transition-colors placeholder-gray-400"
          />
          <p *ngIf="phoneError" class="text-xs text-red-500 mt-1">{{ phoneError }}</p>
        </div>
        <div *ngIf="error" class="mb-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {{ error }}
        </div>
        <button (click)="initiatePayment()"
          class="w-full py-3 rounded-lg text-white font-semibold text-sm transition-opacity bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-2">
          <i class="fas fa-paper-plane"></i>
          Send Payment Request
        </button>
      </ng-container>

      <!-- State: sending -->
      <ng-container *ngIf="state === 'sending'">
        <div class="flex flex-col items-center py-4 text-center">
          <div class="flex gap-2 mb-4">
            <span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-bounce" style="animation-delay:0s"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-bounce" style="animation-delay:0.15s"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-bounce" style="animation-delay:0.3s"></span>
          </div>
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">Sending payment request&hellip;</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Please wait while we send the request to <strong>{{ displayPhone }}</strong></p>
        </div>
      </ng-container>

      <!-- State: checking -->
      <ng-container *ngIf="state === 'checking'">
        <div class="flex flex-col items-center py-2 text-center">
          <div class="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl mb-3 text-amber-600 dark:text-amber-400">
            <i class="fas fa-mobile-alt"></i>
          </div>
          <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">Check your phone!</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            A payment request has been sent to <strong>{{ displayPhone }}</strong>.
            Enter your M-Pesa PIN to confirm.
          </p>
          <!-- Progress bar -->
          <div class="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
            <div class="h-2 rounded-full transition-all duration-500"
              [style.width.%]="(checkCount / maxChecks) * 100"
              [class]="checkCount >= maxChecks - 2 ? 'bg-red-500' : 'bg-green-500'">
            </div>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">Waiting for confirmation… ({{ checkCount }}/{{ maxChecks }})</p>
          <div class="text-left w-full bg-gray-50 dark:bg-slate-900/60 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div class="flex items-center gap-2"><i class="fas fa-check-circle text-green-500 text-xs"></i> STK Push sent to your phone</div>
            <div class="flex items-center gap-2"><i class="fas fa-circle text-gray-300 text-xs"></i> Enter your M-Pesa PIN when prompted</div>
            <div class="flex items-center gap-2"><i class="fas fa-circle text-gray-300 text-xs"></i> Do not close this screen</div>
          </div>
        </div>
      </ng-container>

      <!-- State: success -->
      <ng-container *ngIf="state === 'success'">
        <div class="flex flex-col items-center py-2 text-center">
          <div class="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-3xl mb-3 text-green-600 dark:text-green-400">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">Payment Successful!</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">{{ formatCurrency(amount) }} received successfully.</p>
          <div class="w-full bg-gray-50 dark:bg-slate-900/60 rounded-xl p-3 text-xs text-left space-y-2 mb-4">
            <div class="flex justify-between">
              <span class="text-gray-400 dark:text-gray-500">M-Pesa Code</span>
              <span class="font-semibold text-gray-800 dark:text-gray-200">{{ successData?.mpesaReceiptNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400 dark:text-gray-500">Amount</span>
              <span class="font-semibold text-green-600 dark:text-green-400">{{ formatCurrency(amount) }}</span>
            </div>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Closing automatically…</p>
        </div>
      </ng-container>

      <!-- State: failed -->
      <ng-container *ngIf="state === 'failed'">
        <div class="flex flex-col items-center py-2 text-center">
          <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-3xl mb-3 text-red-600 dark:text-red-400">
            <i class="fas fa-times-circle"></i>
          </div>
          <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">Payment Failed</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ error || 'The payment was not completed. Please try again.' }}</p>
          <button (click)="retry()" class="w-full py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold text-sm">
            Try Again
          </button>
        </div>
      </ng-container>

    </div>
  </div>
</div>
  `,
})
export class StkPushComponent implements OnInit, OnDestroy {
  @Input() amount: number = 0;
  @Input() accountReference: string = 'Bomapro';
  @Input() description: string = 'Rent Payment';
  @Input() clientId: string = '';
  @Input() defaultPhone: string = '';
  @Input() unitNumber: string = '';

  @Output() paymentSuccess = new EventEmitter<StkPushResult>();
  @Output() cancelled = new EventEmitter<void>();

  state: StkPushState = 'idle';
  phoneInput = '';
  displayPhone = '';
  phoneError = '';
  error = '';
  checkCount = 0;
  maxChecks = 12;
  successData: StkPushResult | null = null;

  private isDestroyed = false;
  private timerSub: Subscription | null = null;
  private checkoutRequestId = '';
  private transactionId = '';

  constructor(private mpesaService: MpesaService) {}

  ngOnInit() {
    if (this.defaultPhone) this.phoneInput = this.defaultPhone;
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.timerSub?.unsubscribe();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
  }

  private validatePhone(): boolean {
    this.phoneError = '';
    const raw = this.phoneInput.trim();
    const kenyanPhone = /^(?:254|\+254|0)?(7\d{8}|1\d{7})$/;
    if (!kenyanPhone.test(raw)) {
      this.phoneError = 'Enter a valid Kenyan phone number (e.g. 0712345678)';
      return false;
    }
    return true;
  }

  initiatePayment() {
    if (!this.validatePhone()) return;
    if (!this.clientId) {
      this.error = 'M-Pesa not configured. Please contact your property manager.';
      return;
    }

    const formatted = this.mpesaService.formatPhone(this.phoneInput.trim());
    this.displayPhone = formatted;
    this.state = 'sending';
    this.error = '';

    this.mpesaService.initiateSTKPush({
      phoneNumber: formatted,
      amount: this.amount,
      accountReference: this.accountReference.slice(0, 20),
      description: this.description.slice(0, 13),
      clientId: this.clientId,
    }).subscribe({
      next: (res) => {
        if (!res.success) {
          this.state = 'failed';
          this.error = 'Failed to send payment request. Please try again.';
          return;
        }
        this.checkoutRequestId = res.data.checkoutRequestId;
        this.transactionId = res.data.transactionId;
        this.state = 'checking';
        this.checkCount = 0;
        this.startPolling();
      },
      error: (err) => {
        this.state = 'failed';
        this.error = err?.error?.message || 'Payment request failed. Check your internet connection.';
      },
    });
  }

  private startPolling() {
    this.timerSub?.unsubscribe();
    this.timerSub = timer(3000, 5000).pipe(
      takeWhile(() => !this.isDestroyed && this.state === 'checking' && this.checkCount < this.maxChecks),
      switchMap(() => this.mpesaService.checkTransactionStatus(this.checkoutRequestId)),
    ).subscribe({
      next: (res) => {
        this.checkCount++;
        if (res.success && res.data.status === 'completed') {
          this.onSuccess(res.data.mpesaReceiptNumber);
        } else if (res.data.status === 'failed') {
          this.state = 'failed';
          this.error = res.data.resultDesc || 'Payment was declined or cancelled.';
          this.timerSub?.unsubscribe();
        } else if (this.checkCount >= this.maxChecks) {
          this.state = 'failed';
          this.error = 'Payment timed out. Please check your M-Pesa messages and try again.';
          this.timerSub?.unsubscribe();
        }
      },
      error: () => {
        this.checkCount++;
        if (this.checkCount >= this.maxChecks) {
          this.state = 'failed';
          this.error = 'Could not verify payment status. Check your M-Pesa messages.';
        }
      },
    });
  }

  private onSuccess(mpesaReceiptNumber: string) {
    this.timerSub?.unsubscribe();
    this.state = 'success';
    this.successData = {
      success: true,
      mpesaReceiptNumber,
      transactionId: this.transactionId,
      checkoutRequestId: this.checkoutRequestId,
    };
    // Auto-close after 2.5s and emit result
    setTimeout(() => {
      if (!this.isDestroyed) {
        this.paymentSuccess.emit(this.successData!);
      }
    }, 2500);
  }

  retry() {
    this.timerSub?.unsubscribe();
    this.state = 'idle';
    this.error = '';
    this.phoneError = '';
    this.checkCount = 0;
    this.checkoutRequestId = '';
    this.transactionId = '';
    this.successData = null;
  }

  cancel() {
    this.timerSub?.unsubscribe();
    this.cancelled.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (this.state === 'idle' || this.state === 'failed') {
      this.cancel();
    }
  }
}
