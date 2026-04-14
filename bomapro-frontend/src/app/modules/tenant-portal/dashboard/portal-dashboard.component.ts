import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TenantPortalService } from '../shared/services/tenant-portal.service';
import { TenantPortalAuthService } from '../shared/services/tenant-portal-auth.service';
import { PortalBalance, PortalLease, PortalPayment, PortalProfile } from '../shared/interfaces/portal.interfaces';

@Component({
  selector: 'app-portal-dashboard',
  templateUrl: './portal-dashboard.component.html',
  styleUrls: ['./portal-dashboard.component.scss'],
})
export class PortalDashboardComponent implements OnInit {
  profile: PortalProfile | null = null;
  lease: PortalLease | null = null;
  recentPayments: PortalPayment[] = [];
  balance: PortalBalance | null = null;
  loading = true;
  error = '';

  get daysUntilDue(): number | null {
    if (!this.lease) return null;
    const now = new Date();
    const due = new Date(now.getFullYear(), now.getMonth(), this.lease.paymentDueDay);
    if (due < now) due.setMonth(due.getMonth() + 1);
    return Math.ceil((due.getTime() - now.getTime()) / 86400000);
  }

  get leaseProgress(): number {
    if (!this.lease) return 0;
    const start = new Date(this.lease.startDate).getTime();
    const end = new Date(this.lease.endDate).getTime();
    const now = Date.now();
    return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  }

  constructor(
    private portalService: TenantPortalService,
    private auth: TenantPortalAuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.profile = this.auth.getProfile();
    this.load();
  }

  load() {
    this.loading = true;
    this.portalService.getLease().subscribe({
      next: (lease) => {
        this.lease = lease;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
    this.portalService.getPayments().subscribe({
      next: (payments) => (this.recentPayments = payments.slice(0, 3)),
      error: () => {},
    });
    this.portalService.getBalance().subscribe({
      next: (b) => (this.balance = b),
      error: () => {},
    });
  }

  goToPayment() {
    this.router.navigate(['/tenant-portal/payments']);
  }

  getFirstName(profile: any): string {
    if (!profile || !profile.name || typeof profile.name !== 'string') return 'Tenant';
    return profile.name.split(' ')[0];
  }
}
