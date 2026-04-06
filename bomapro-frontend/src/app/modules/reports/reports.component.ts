import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { ReportsService } from '../../shared/services/reports/reports.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { DashboardStats } from '../../shared/interfaces/models';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, OnDestroy {
  stats: DashboardStats | null = null;
  revenue: any = null;
  occupancy: any = null;
  leaseExpiry: any = null;
  damageReport: any = null;
  loading = true;
  selectedYear = new Date().getFullYear();
  expiryDays = 90;

  private revenueChart: Chart | null = null;
  private paymentChart: Chart | null = null;
  private occupancyChart: Chart | null = null;
  private damagesChart: Chart | null = null;

  constructor(
    public reportsService: ReportsService,
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.loadReports(); }

  ngOnDestroy(): void {
    this.revenueChart?.destroy();
    this.paymentChart?.destroy();
    this.occupancyChart?.destroy();
    this.damagesChart?.destroy();
  }

  loadReports(): void {
    this.loading = true;
    this.reportsService.getDashboard().subscribe({
      next: (s) => {
        this.stats = s;
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => { this.buildPaymentChart(); this.buildOccupancyChart(); }, 80);
      },
      error: () => { this.loading = false; },
    });
    this.reportsService.getRevenue(this.selectedYear).subscribe((r) => {
      this.revenue = r;
      setTimeout(() => this.buildRevenueChart(), 80);
    });
    this.reportsService.getOccupancy().subscribe((o) => { this.occupancy = o; });
    this.reportsService.getLeaseExpiry(this.expiryDays).subscribe((l) => (this.leaseExpiry = l));
    this.reportsService.getDamages().subscribe((d) => {
      this.damageReport = d;
      setTimeout(() => this.buildDamagesChart(), 80);
    });
  }

  loadRevenue(): void {
    this.reportsService.getRevenue(this.selectedYear).subscribe((r) => {
      this.revenue = r;
      setTimeout(() => this.buildRevenueChart(), 80);
    });
  }

  private isDark(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  private get tickColor(): string { return this.isDark() ? '#9ca3af' : '#6b7280'; }
  private get gridColor(): string { return this.isDark() ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; }

  private buildRevenueChart(): void {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas || !this.revenue?.months) return;
    this.revenueChart?.destroy();
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data = this.revenue.months.map((m: any) => m.revenue);
    const accent = this.themeService.accent;
    this.revenueChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: monthNames,
        datasets: [{
          label: 'Revenue (KES)',
          data,
          backgroundColor: accent + 'bb',
          borderColor: accent,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => ` KES ${Number(ctx.raw).toLocaleString()}` },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => `${Number(v).toLocaleString()}`, color: this.tickColor },
            grid: { color: this.gridColor },
            border: { display: false },
          },
          x: { ticks: { color: this.tickColor }, grid: { display: false }, border: { display: false } },
        },
      },
    });
  }

  private buildPaymentChart(): void {
    const canvas = document.getElementById('paymentChart') as HTMLCanvasElement;
    if (!canvas || !this.stats?.payments) return;
    this.paymentChart?.destroy();
    const { completed, pending, total } = this.stats.payments;
    const others = Math.max(0, total - completed - pending);
    this.paymentChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Pending', 'Other'],
        datasets: [{ data: [completed, pending, others], backgroundColor: ['#22c55e','#f59e0b','#ef4444'], borderWidth: 2, borderColor: this.isDark() ? '#1e293b' : '#ffffff', hoverOffset: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { color: this.tickColor, padding: 14, font: { size: 12 } } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` } },
        },
      },
    });
  }

  private buildOccupancyChart(): void {
    const canvas = document.getElementById('occupancyChart') as HTMLCanvasElement;
    if (!canvas || !this.stats?.properties) return;
    this.occupancyChart?.destroy();
    const { occupied, available } = this.stats.properties;
    const accent = this.themeService.accent;
    this.occupancyChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Occupied', 'Available'],
        datasets: [{ data: [occupied, available], backgroundColor: [accent, this.isDark() ? '#334155' : '#e5e7eb'], borderWidth: 2, borderColor: this.isDark() ? '#1e293b' : '#ffffff', hoverOffset: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { color: this.tickColor, padding: 14, font: { size: 12 } } },
        },
      },
    });
  }

  private buildDamagesChart(): void {
    const canvas = document.getElementById('damagesChart') as HTMLCanvasElement;
    if (!canvas || !this.damageReport) return;
    this.damagesChart?.destroy();
    const { reported, assessed, inRepair, repaired } = this.damageReport;
    this.damagesChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Reported','Assessed','In Repair','Repaired'],
        datasets: [{ data: [reported, assessed, inRepair, repaired], backgroundColor: ['#f59e0b','#3b82f6','#ef4444','#22c55e'], borderRadius: 6, borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { color: this.tickColor, stepSize: 1 }, grid: { color: this.gridColor }, border: { display: false } },
          y: { ticks: { color: this.tickColor }, grid: { display: false }, border: { display: false } },
        },
      },
    });
  }

  loadExpiry(): void {
    this.reportsService.getLeaseExpiry(this.expiryDays).subscribe(l => (this.leaseExpiry = l));
  }

  getDaysUntil(endDate: string): number {
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  }

  expiryBadgeClass(days: number): string {
    if (days <= 30) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (days <= 60) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  }

  get annualTotal(): number {
    return this.revenue?.totalAnnual ?? this.revenue?.months?.reduce((s: number, m: any) => s + m.revenue, 0) ?? 0;
  }
}
