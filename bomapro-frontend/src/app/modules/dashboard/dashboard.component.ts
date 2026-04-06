import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReportsService } from '../../shared/services/reports/reports.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { DashboardStats } from '../../shared/interfaces/models';
import { AuthService } from '../../shared/services/auth/auth.service';
import { LeasesService } from '../../shared/services/leases/leases.service';
import { PaymentsService } from '../../shared/services/payments/payments.service';
import { MaintenanceRequestsService } from '../../shared/services/maintenance-requests/maintenance-requests.service';
import { PropertyFilterService } from '../../shared/services/property-filter/property-filter.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats | null = null;
  loading = true;
  isTenant = false;
  tenantStats: any = null;

  private filterSub: Subscription | null = null;

  constructor(
    private reportsService: ReportsService,
    public themeService: ThemeService,
    private authService: AuthService,
    private leasesService: LeasesService,
    private paymentsService: PaymentsService,
    private maintenanceService: MaintenanceRequestsService,
    public propertyFilterService: PropertyFilterService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isTenant = user?.role === 'tenant';

    if (this.isTenant) {
      this.loadTenantDashboard();
    } else {
      this.filterSub = this.propertyFilterService.selectedPropertyId$.subscribe(id => {
        this.loadOrgDashboard(id || undefined);
      });
    }
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  private loadOrgDashboard(propertyId?: string): void {
    this.loading = true;
    this.reportsService.getDashboard(propertyId).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private loadTenantDashboard(): void {
    // Load tenant-specific data
    Promise.all([
      new Promise((resolve) => {
        this.leasesService.getAll(1, 10).subscribe({
          next: (data) => resolve(data),
          error: () => resolve(null),
        });
      }),
      new Promise((resolve) => {
        this.paymentsService.getAll(1, 10).subscribe({
          next: (data) => resolve(data),
          error: () => resolve(null),
        });
      }),
      new Promise((resolve) => {
        this.maintenanceService.getAll(1, 10).subscribe({
          next: (data) => resolve(data),
          error: () => resolve(null),
        });
      }),
    ]).then(([leases, payments, maintenance]: any[]) => {
      this.tenantStats = {
        activeLeases: leases?.data?.filter((l: any) => l.status === 'active').length || 0,
        totalLeases: leases?.data?.length || 0,
        pendingPayments: payments?.data?.filter((p: any) => p.status === 'pending').length || 0,
        paidPayments: payments?.data?.filter((p: any) => p.status === 'paid').length || 0,
        totalPayments: payments?.data?.length || 0,
        maintenanceRequests: maintenance?.data?.length || 0,
        pendingMaintenance: maintenance?.data?.filter((m: any) => m.status === 'pending').length || 0,
      };
      this.loading = false;
    });
  }

  get activeTenant() {
    const id = this.authService.getActiveTenantId();
    return this.authService.getTenants().find((t) => t._id === id) || null;
  }

  get tenantCount(): number {
    return this.authService.getTenants().length;
  }
}
