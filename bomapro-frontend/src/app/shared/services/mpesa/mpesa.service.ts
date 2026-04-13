import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const PROXY_BASE = 'https://urchin-app-ycear.ondigitalocean.app';

export interface StkPushPayload {
  phoneNumber: string;   // 254xxxxxxxxx
  amount: number;
  accountReference: string;
  description: string;
  clientId: string;
}

export interface StkPushResponse {
  success: boolean;
  data: {
    checkoutRequestId: string;
    transactionId: string;
  };
}

export interface TransactionStatusResponse {
  success: boolean;
  data: {
    status: 'completed' | 'failed' | 'pending';
    resultDesc: string;
    mpesaReceiptNumber: string;
  };
}

@Injectable({ providedIn: 'root' })
export class MpesaService {
  constructor(private http: HttpClient) {}

  initiateSTKPush(payload: StkPushPayload): Observable<StkPushResponse> {
    return this.http.post<StkPushResponse>(`${PROXY_BASE}/mpesa/stk-push`, payload);
  }

  checkTransactionStatus(checkoutRequestId: string): Observable<TransactionStatusResponse> {
    return this.http.get<TransactionStatusResponse>(
      `${PROXY_BASE}/mpesa/transaction/${checkoutRequestId}`,
    );
  }

  /** Format Kenyan phone number to 254xxxxxxxxx */
  formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) return '254' + digits.slice(1);
    if (digits.startsWith('254')) return digits;
    if (digits.startsWith('7') || digits.startsWith('1')) return '254' + digits;
    return digits;
  }
}
