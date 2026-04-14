import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { AuthService } from '../../shared/services/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  superAdminOnly?: boolean;
  roles?: string[]; // Specify which roles can see this item
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Input() mobileHidden = true;
  @Input() isMobile = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();

  allNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'fas fa-th-large', route: '/dashboard', roles: ['super_admin', 'admin', 'manager', 'agent', 'tenant'] },
    { label: 'Properties', icon: 'fas fa-building', route: '/properties', roles: ['super_admin', 'admin', 'manager', 'agent'] },
    { label: 'Units', icon: 'fas fa-door-open', route: '/units', roles: ['super_admin', 'admin', 'manager', 'agent'] },
    { label: 'Tenants', icon: 'fas fa-users', route: '/tenants', roles: ['super_admin', 'admin', 'manager'] },
    { label: 'Leases', icon: 'fas fa-file-contract', route: '/leases', roles: ['super_admin', 'admin', 'manager', 'agent', 'tenant'] },
    { label: 'Payments', icon: 'fas fa-money-bill-wave', route: '/payments', roles: ['super_admin', 'admin', 'manager', 'agent', 'tenant'] },
    { label: 'Invoices', icon: 'fas fa-file-invoice-dollar', route: '/invoices', roles: ['super_admin', 'admin', 'manager', 'agent'] },
    { label: 'Damages', icon: 'fas fa-tools', route: '/damages', roles: ['super_admin', 'admin', 'manager', 'agent'] },
    { label: 'Reports', icon: 'fas fa-chart-bar', route: '/reports', roles: ['super_admin', 'admin', 'manager'] },
    { label: 'Users', icon: 'fas fa-users-cog', route: '/users', roles: ['super_admin', 'admin'] },
    { label: 'Settings', icon: 'fas fa-cog', route: '/settings', roles: ['super_admin', 'admin'] },
    { label: 'Organizations', icon: 'fas fa-city', route: '/system-tenants', superAdminOnly: true },
  ];

  navItems: NavItem[] = [];
  private userSub?: Subscription;

  constructor(
    public router: Router,
    public themeService: ThemeService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.user$.subscribe((user) => {
      const userRole = user?.role || '';
      this.navItems = this.allNavItems.filter((item) => {
        // If item has superAdminOnly flag, only show for super_admin
        if (item.superAdminOnly) {
          return userRole === 'super_admin';
        }
        // If item has roles array, check if user role is included
        if (item.roles) {
          return item.roles.includes(userRole);
        }
        // Default: show all items
        return true;
      });
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
