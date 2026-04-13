import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Payment, PaginatedResponse } from '../../interfaces/models';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 20, search?: string, status?: string, paymentMethod?: string): Observable<PaginatedResponse<Payment>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    if (paymentMethod) params = params.set('paymentMethod', paymentMethod);
    return this.http.get<PaginatedResponse<Payment>>(this.apiUrl, { params });
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
}
