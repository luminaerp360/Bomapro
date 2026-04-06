import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TenantPortalAuthService } from '../shared/services/tenant-portal-auth.service';
import { PortalProfile } from '../shared/interfaces/portal.interfaces';

@Component({
  selector: 'app-tenant-portal-layout',
  templateUrl: './tenant-portal-layout.component.html',
  styleUrls: ['./tenant-portal-layout.component.scss'],
})
export class TenantPortalLayoutComponent implements OnInit {
  profile: PortalProfile | null = null;
  sidebarOpen = false;

  navItems = [
    { label: 'Dashboard', icon: 'fas fa-th-large', route: '/tenant-portal/dashboard' },
    { label: 'My Lease', icon: 'fas fa-file-contract', route: '/tenant-portal/lease' },
    { label: 'Make Payment', icon: 'fas fa-credit-card', route: '/tenant-portal/payments' },
    { label: 'Invoices', icon: 'fas fa-receipt', route: '/tenant-portal/invoices' },
    { label: 'Maintenance Requests', icon: 'fas fa-tools', route: '/tenant-portal/maintenance-requests' },
  ];

  constructor(private auth: TenantPortalAuthService, private router: Router) {}

  ngOnInit() {
    this.profile = this.auth.getProfile();
    this.auth.profile$.subscribe((p) => (this.profile = p));
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/tenant-portal/login']);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
