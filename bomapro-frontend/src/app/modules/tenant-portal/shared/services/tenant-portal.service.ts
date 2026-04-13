import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PortalLease, PortalPayment, PortalProfile, MpesaStkResponse } from '../interfaces/portal.interfaces';

@Injectable({ providedIn: 'root' })
export class TenantPortalService {
  private readonly base = `${environment.apiUrl}/tenant-portal`;

  constructor(private http: HttpClient) {}

  getProfile() {
    return this.http.get<PortalProfile>(`${this.base}/profile`);
  }

  updateProfile(phone: string) {
    return this.http.put<PortalProfile>(`${this.base}/profile`, { phone });
  }

  getLease() {
    return this.http.get<PortalLease>(`${this.base}/lease`);
  }

  signLease(leaseId: string) {
    return this.http.post<PortalLease>(`${this.base}/lease/${leaseId}/sign`, {});
  }

  getPayments() {
    return this.http.get<PortalPayment[]>(`${this.base}/payments`);
  }

  getPaymentStatus(paymentId: string) {
    return this.http.get<PortalPayment>(`${this.base}/payments/${paymentId}/status`);
  }

  initiateMpesaPayment(payload: {
    phoneNumber: string;
    amount: number;
    leaseId: string;
    paymentPeriod?: string;
    notes?: string;
  }) {
    return this.http.post<MpesaStkResponse>(`${this.base}/payments/mpesa-stk`, payload);
  }

  getInvoices() {
    return this.http.get<PortalPayment[]>(`${this.base}/invoices`);
  }

  getOrgSettings() {
    return this.http.get<{ mpesaClientId: string; orgName: string }>(`${this.base}/org-settings`);
  }

  confirmMpesaPayment(payload: {
    leaseId: string;
    amount: number;
    phoneNumber: string;
    mpesaReceiptNumber: string;
    checkoutRequestId: string;
    paymentPeriod?: string;
    notes?: string;
  }) {
    return this.http.post<PortalPayment>(`${this.base}/payments/confirm-mpesa`, payload);
  }
}
