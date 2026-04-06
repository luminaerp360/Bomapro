import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PropertyTenant, PaginatedResponse } from '../../interfaces/models';

@Injectable({ providedIn: 'root' })
export class PropertyTenantsService {
  private apiUrl = `${environment.apiUrl}/property-tenants`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 20, search?: string, propertyId?: string): Observable<PaginatedResponse<PropertyTenant>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (propertyId) params = params.set('propertyId', propertyId);
    return this.http.get<PaginatedResponse<PropertyTenant>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<PropertyTenant> {
    return this.http.get<PropertyTenant>(`${this.apiUrl}/${id}`);
  }

  getByProperty(propertyId: string): Observable<PropertyTenant[]> {
    return this.http.get<PropertyTenant[]>(`${this.apiUrl}/by-property/${propertyId}`);
  }

  create(data: Partial<PropertyTenant>): Observable<PropertyTenant> {
    return this.http.post<PropertyTenant>(this.apiUrl, data);
  }

  update(id: string, data: Partial<PropertyTenant>): Observable<PropertyTenant> {
    return this.http.put<PropertyTenant>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}
