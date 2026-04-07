import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TenantPortalAuthService } from '../shared/services/tenant-portal-auth.service';
import { TenantPortalService } from '../shared/services/tenant-portal.service';
import { PortalThemeService } from '../shared/services/portal-theme.service';
import { PortalProfile, PortalLease } from '../shared/interfaces/portal.interfaces';

@Component({
  selector: 'app-tenant-portal-layout',
  templateUrl: './tenant-portal-layout.component.html',
  styleUrls: ['./tenant-portal-layout.component.scss'],
})
export class TenantPortalLayoutComponent implements OnInit {
  profile: PortalProfile | null = null;
  lease: PortalLease | null = null;
  sidebarOpen = false;
  themeOpen = false;

  navItems = [
    { label: 'Dashboard', icon: 'fas fa-th-large', route: '/tenant-portal/dashboard' },
    { label: 'My Lease', icon: 'fas fa-file-contract', route: '/tenant-portal/lease' },
    { label: 'Make Payment', icon: 'fas fa-credit-card', route: '/tenant-portal/payments' },
    { label: 'Invoices', icon: 'fas fa-receipt', route: '/tenant-portal/invoices' },
    { label: 'Maintenance Requests', icon: 'fas fa-tools', route: '/tenant-portal/maintenance-requests' },
  ];

  constructor(
    private auth: TenantPortalAuthService,
    private portalService: TenantPortalService,
    private router: Router,
    public theme: PortalThemeService,
  ) {}

  ngOnInit() {
    this.profile = this.auth.getProfile();
    this.auth.profile$.subscribe((p) => (this.profile = p));
    this.portalService.getLease().subscribe({
      next: (lease) => (this.lease = lease),
      error: () => {},
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/tenant-portal/login']);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
