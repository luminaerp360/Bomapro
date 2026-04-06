import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardStats } from '../../interfaces/models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getDashboard(propertyId?: string): Observable<DashboardStats> {
    const params: Record<string, string> = {};
    if (propertyId) params['propertyId'] = propertyId;
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`, { params });
  }

  getRevenue(year?: number, propertyId?: string): Observable<any> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    if (propertyId) params['propertyId'] = propertyId;
    return this.http.get<any>(`${this.apiUrl}/revenue`, { params });
  }

  getOccupancy(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/occupancy`);
  }

  getLeaseExpiry(days?: number, propertyId?: string): Observable<any> {
    const params: Record<string, string> = {};
    if (days) params['days'] = days.toString();
    if (propertyId) params['propertyId'] = propertyId;
    return this.http.get<any>(`${this.apiUrl}/lease-expiry`, { params });
  }

  getDamages(propertyId?: string): Observable<any> {
    const params: Record<string, string> = {};
    if (propertyId) params['propertyId'] = propertyId;
    return this.http.get<any>(`${this.apiUrl}/damages`, { params });
  }
}
