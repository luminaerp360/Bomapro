import { ChangeDetectorRef, Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ReportsService } from '../../shared/services/reports/reports.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { DashboardStats, Tenant } from '../../shared/interfaces/models';
import { AuthService } from '../../shared/services/auth/auth.service';
import { LeasesService } from '../../shared/services/leases/leases.service';
import { PaymentsService } from '../../shared/services/payments/payments.service';
import { MaintenanceRequestsService } from '../../shared/services/maintenance-requests/maintenance-requests.service';
import { PropertyFilterService } from '../../shared/services/property-filter/property-filter.service';

Chart.register(...registerables);

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
  currentYear = new Date().getFullYear();
  activeTenant: Tenant | null = null;
  tenantCount = 0;

  private revenueChart: Chart | null = null;
  private occupancyChart: Chart | null = null;
  private paymentMethodChart: Chart | null = null;
  private filterSub: Subscription | null = null;

  constructor(
    private reportsService: ReportsService,
    public themeService: ThemeService,
    private authService: AuthService,
    private leasesService: LeasesService,
    private paymentsService: PaymentsService,
    private maintenanceService: MaintenanceRequestsService,
    public propertyFilterService: PropertyFilterService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isTenant = user?.role === 'tenant';
    const tenants = this.authService.getTenants();
    this.tenantCount = tenants.length;
    const activeId = this.authService.getActiveTenantId();
    this.activeTenant = tenants.find((t) => t._id === activeId) || null;

    if (this.isTenant) {
      this.loadTenantDashboard();
    } else {
      this.filterSub = this.propertyFilterService.selectedPropertyId$.subscribe((id) => {
        this.loadOrgDashboard(id || undefined);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    this.filterSub?.unsubscribe();
  }

  private destroyCharts(): void {
    this.revenueChart?.destroy();
    this.occupancyChart?.destroy();
    this.paymentMethodChart?.destroy();
  }

  private loadOrgDashboard(propertyId?: string): void {
    this.loading = true;
    this.reportsService.getDashboard(propertyId).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderCharts(), 80);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private isDark(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  private get tickColor(): string {
    return this.isDark() ? '#9ca3af' : '#6b7280';
  }

  private get gridColor(): string {
    return this.isDark() ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  }

  private renderCharts(): void {
    this.ngZone.runOutsideAngular(() => {
      this.buildRevenueChart();
      this.buildOccupancyChart();
      this.buildPaymentMethodChart();
    });
  }

  private buildRevenueChart(): void {
    const canvas = document.getElementById('dashboardRevenueChart') as HTMLCanvasElement;
    if (!canvas || !this.stats?.revenue) return;
    this.revenueChart?.destroy();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trend = this.stats.revenue.monthlyTrend || [];
    const revenueData = monthNames.map((_, idx) => {
      const found = trend.find((m) => m.month === idx + 1);
      return found ? found.revenue : 0;
    });
    const expectedMonthly = this.stats.revenue.expectedMonthly || 0;
    const expectedLine = monthNames.map(() => expectedMonthly);
    const accent = this.themeService.accent || '#2563eb';

    const datasets: any[] = [
      {
        label: 'Collected Revenue (KES)',
        data: revenueData,
        backgroundColor: accent + 'cc',
        borderColor: accent,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ];

    if (expectedMonthly > 0) {
      datasets.push({
        label: 'Expected Rent (KES)',
        data: expectedLine,
        backgroundColor: this.isDark() ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.18)',
        borderColor: '#10b981',
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      });
    }

    this.revenueChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: monthNames,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: expectedMonthly > 0,
            position: 'top',
            align: 'end',
            labels: { color: this.tickColor, boxWidth: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: KES ${Number(ctx.raw).toLocaleString()}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => `KES ${Number(v).toLocaleString()}`,
              color: this.tickColor,
              font: { size: 11 },
            },
            grid: { color: this.gridColor },
            border: { display: false },
          },
          x: {
            ticks: { color: this.tickColor, font: { size: 11 } },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    });
  }

  private buildOccupancyChart(): void {
    const canvas = document.getElementById('dashboardOccupancyChart') as HTMLCanvasElement;
    if (!canvas || !this.stats) return;
    this.occupancyChart?.destroy();

    const occupied = this.stats.units?.occupied ?? this.stats.properties.occupied ?? 0;
    const vacant = this.stats.units?.vacant ?? this.stats.properties.available ?? 0;
    const maintenance = this.stats.units?.maintenance ?? 0;
    const accent = this.themeService.accent || '#2563eb';

    this.occupancyChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Occupied', 'Vacant / Available', 'Maintenance'],
        datasets: [
          {
            data: [occupied, vacant, maintenance],
            backgroundColor: [accent, this.isDark() ? '#334155' : '#cbd5e1', '#f59e0b'],
            borderWidth: 2,
            borderColor: this.isDark() ? '#1e293b' : '#ffffff',
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: this.tickColor, padding: 12, font: { size: 11 }, boxWidth: 10 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} unit${Number(ctx.raw) !== 1 ? 's' : ''}`,
            },
          },
        },
      },
    });
  }

  private buildPaymentMethodChart(): void {
    const canvas = document.getElementById('dashboardPaymentMethodChart') as HTMLCanvasElement;
    if (!canvas || !this.stats?.payments) return;
    this.paymentMethodChart?.destroy();

    const byMethod = this.stats.payments.byMethod || [];
    const hasMethods = byMethod.length > 0 && byMethod.some((m) => m.amount > 0);

    const labels = hasMethods
      ? byMethod.map((m) => this.formatMethodLabel(m.method))
      : ['Completed', 'Pending'];
    const data = hasMethods
      ? byMethod.map((m) => m.amount)
      : [this.stats.payments.completed || 0, this.stats.payments.pending || 0];
    const colors = hasMethods
      ? ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b']
      : ['#10b981', '#f59e0b'];

    this.paymentMethodChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, data.length),
            borderWidth: 2,
            borderColor: this.isDark() ? '#1e293b' : '#ffffff',
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: this.tickColor, padding: 12, font: { size: 11 }, boxWidth: 10 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                hasMethods
                  ? ` ${ctx.label}: KES ${Number(ctx.raw).toLocaleString()}`
                  : ` ${ctx.label}: ${ctx.raw} payment(s)`,
            },
          },
        },
      },
    });
  }

  formatMethodLabel(method: string): string {
    const map: Record<string, string> = {
      mpesa: 'M-Pesa',
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      cheque: 'Cheque',
      card: 'Card',
      other: 'Other',
    };
    return map[method] || method || 'Other';
  }

  expiryBadgeClass(days: number): string {
    if (days <= 14) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (days <= 30) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
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
}
