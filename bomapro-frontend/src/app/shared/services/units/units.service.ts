import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Unit {
  _id?: string;
  tenantId?: string;
  propertyId: string;
  propertyName?: string;
  unitNumber: string;
  description?: string;
  unitType?: string;
  floor?: number | string;
  status: string;
  rentAmount: number;
  currency?: string;
  securityDeposit?: number;
  electricityMeterNumber?: string;
  waterMeterNumber?: string;
  rentCycle?: string;
  currentTenantId?: string;
  currentTenantName?: string;
  currentLeaseId?: string;
  currentPropertyTenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class UnitsService {
  private apiUrl = `${environment.apiUrl}/units`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 1,
    limit = 20,
    propertyId?: string,
    status?: string,
    search?: string,
    unitType?: string,
    floor?: string | number,
  ): Observable<PaginatedResponse<Unit>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (propertyId) params = params.set('propertyId', propertyId);
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    if (unitType) params = params.set('unitType', unitType);
    if (floor !== undefined && floor !== null && floor !== '') params = params.set('floor', String(floor));
    return this.http.get<PaginatedResponse<Unit>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<Unit> {
    return this.http.get<Unit>(`${this.apiUrl}/${id}`);
  }

  getByProperty(propertyId: string): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.apiUrl}/property/${propertyId}`);
  }

  findAvailableByProperty(propertyId: string): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.apiUrl}/available/${propertyId}`);
  }

  create(data: Partial<Unit>): Observable<Unit> {
    return this.http.post<Unit>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Unit>): Observable<Unit> {
    return this.http.put<Unit>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  bulkImport(data: { units?: any[]; csvText?: string }): Observable<{
    success: boolean;
    message: string;
    total: number;
    created: number;
    updated: number;
    skipped: number;
    propertiesAffected: string[];
  }> {
    return this.http.post<any>(`${this.apiUrl}/bulk-import`, data);
  }

    getStats(propertyId?: string): Observable<any> {
    let params = new HttpParams();
    if (propertyId) {
      params = params.set('propertyId', propertyId);
    }
    return this.http.get<any>(`${this.apiUrl}/stats`, { params });
  }
}
