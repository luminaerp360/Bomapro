import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Tenant, PaginatedResponse } from '../../interfaces/models';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(this.apiUrl);
  }

  getById(id: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Tenant>): Observable<Tenant> {
    return this.http.post<Tenant>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Tenant>): Observable<Tenant> {
    return this.http.put<Tenant>(`${this.apiUrl}/${id}`, data);
  }

  sendTestEmail(id: string, email?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/${id}/test-email`, { email });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
