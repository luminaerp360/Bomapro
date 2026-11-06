import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Payment, PaginatedResponse, RentInvoice } from '../../interfaces/models';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private apiUrl = `${environment.apiUrl}/payments`;
  private schedulesUrl = `${environment.apiUrl}/rent-schedules`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 20, search?: string, status?: string, paymentMethod?: string): Observable<PaginatedResponse<Payment>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    if (paymentMethod) params = params.set('paymentMethod', paymentMethod);
    return this.http.get<PaginatedResponse<Payment>>(this.apiUrl, { params });
  }

  getInvoices(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    propertyId?: string;
    leaseId?: string;
    month?: string;
    scope?: string;
  } = {}): Observable<{
    data: RentInvoice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: {
      totalInvoicedDue: number;
      totalCollected: number;
      totalOutstanding: number;
      overdueCount: number;
      overdueAmount: number;
      unpaidCount: number;
      paidThisMonthCount: number;
      paidThisMonthAmount: number;
    };
  }> {
    let params = new HttpParams()
      .set('page', options.page || 1)
      .set('limit', options.limit || 50)
      .set('scope', options.scope || 'due');
    if (options.search) params = params.set('search', options.search);
    if (options.status) params = params.set('status', options.status);
    if (options.propertyId) params = params.set('propertyId', options.propertyId);
    if (options.leaseId) params = params.set('leaseId', options.leaseId);
    if (options.month) params = params.set('month', options.month);
    return this.http.get<any>(this.schedulesUrl, { params });
  }

  getSchedulesByLease(leaseId: string): Observable<RentInvoice[]> {
    return this.http.get<RentInvoice[]>(`${this.schedulesUrl}/by-lease/${leaseId}`);
  }

  getLeaseScheduleBalance(leaseId: string): Observable<{
    totalDue: number;
    totalPaid: number;
    totalOverdue: number;
    totalContractAmount: number;
    balance: number;
    contractBalance: number;
  }> {
    return this.http.get<any>(`${this.schedulesUrl}/balance/${leaseId}`);
  }

  sendInvoiceEmail(scheduleId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.schedulesUrl}/${scheduleId}/send-invoice`, {});
  }

  getById(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`);
  }

  getByLease(leaseId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/by-lease/${leaseId}`);
  }

  getByProperty(propertyId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/by-property/${propertyId}`);
  }

  getByTenant(propertyTenantId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/by-tenant/${propertyTenantId}`);
  }

  getByDateRange(startDate: string, endDate: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/date-range`, { params: { startDate, endDate } });
  }

  create(data: Partial<Payment>): Observable<Payment> {
    return this.http.post<Payment>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Payment>): Observable<Payment> {
    return this.http.put<Payment>(`${this.apiUrl}/${id}`, data);
  }

  markCompleted(id: string): Observable<Payment> {
    return this.http.put<Payment>(`${this.apiUrl}/${id}/complete`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  confirmMpesaPayment(payload: {
    leaseId?: string;
    propertyTenantId?: string;
    propertyId?: string;
    amount: number;
    phoneNumber: string;
    mpesaReceiptNumber: string;
    checkoutRequestId: string;
    paymentPeriod?: string;
    paymentType?: string;
    notes?: string;
    propertyName?: string;
    propertyTenantName?: string;
  }): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/confirm-mpesa`, payload);
  }

  resendInvoice(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/resend-invoice`, {});
  }

  sendReminder(propertyTenantId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/send-reminder/${propertyTenantId}`, {});
  }
}
