import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ReportsService } from '../../shared/services/reports/reports.service';
import { PropertyFilterService } from '../../shared/services/property-filter/property-filter.service';
import { BomoproUser, Tenant } from '../../shared/interfaces/models';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  section: string;
  superAdminOnly?: boolean;
  roles?: string[];
  badgeKey?: 'vacantUnits' | 'expiringLeases' | 'pendingPayments' | 'openDamages';
  badgeType?: 'info' | 'warning' | 'danger' | 'success';
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
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

  searchQuery = '';
  collapsedSections: Record<string, boolean> = {};
  showOrgDropdown = false;
  switchingOrg = false;
  currentUser: BomoproUser | null = null;

  badges: Record<string, number> = {
    vacantUnits: 0,
    expiringLeases: 0,
    pendingPayments: 0,
    openDamages: 0,
  };

  allNavItems: NavItem[] = [
    // OVERVIEW
    {
      label: 'Dashboard',
      icon: 'fas fa-chart-pie',
      route: '/dashboard',
      section: 'Overview',
      roles: ['super_admin', 'admin', 'manager', 'agent', 'tenant'],
    },
    {
      label: 'Analytics & Reports',
      icon: 'fas fa-chart-line',
      route: '/reports',
      section: 'Overview',
      roles: ['super_admin', 'admin', 'manager'],
    },

    // PORTFOLIO & LEASING
    {
      label: 'Properties',
      icon: 'fas fa-building',
      route: '/properties',
      section: 'Portfolio & Leasing',
      roles: ['super_admin', 'admin', 'manager', 'agent'],
    },
    {
      label: 'Units',
      icon: 'fas fa-door-open',
      route: '/units',
      section: 'Portfolio & Leasing',
      roles: ['super_admin', 'admin', 'manager', 'agent'],
      badgeKey: 'vacantUnits',
      badgeType: 'info',
    },
    {
      label: 'Tenants',
      icon: 'fas fa-user-group',
      route: '/tenants',
      section: 'Portfolio & Leasing',
      roles: ['super_admin', 'admin', 'manager'],
    },
    {
      label: 'Leases',
      icon: 'fas fa-file-contract',
      route: '/leases',
      section: 'Portfolio & Leasing',
      roles: ['super_admin', 'admin', 'manager', 'agent', 'tenant'],
      badgeKey: 'expiringLeases',
      badgeType: 'warning',
    },

    // FINANCE & BILLING
    {
      label: 'Payments',
      icon: 'fas fa-money-bill-transfer',
      route: '/payments',
      section: 'Finance & Billing',
      roles: ['super_admin', 'admin', 'manager', 'agent', 'tenant'],
      badgeKey: 'pendingPayments',
      badgeType: 'warning',
    },
    {
      label: 'Invoices',
      icon: 'fas fa-file-invoice-dollar',
      route: '/invoices',
      section: 'Finance & Billing',
      roles: ['super_admin', 'admin', 'manager', 'agent'],
    },

    // OPERATIONS
    {
      label: 'Damages & Repairs',
      icon: 'fas fa-screwdriver-wrench',
      route: '/damages',
      section: 'Operations',
      roles: ['super_admin', 'admin', 'manager', 'agent'],
      badgeKey: 'openDamages',
      badgeType: 'danger',
    },

    // ADMINISTRATION
    {
      label: 'Users & Roles',
      icon: 'fas fa-user-shield',
      route: '/users',
      section: 'Administration',
      roles: ['super_admin', 'admin'],
    },
    {
      label: 'Organizations',
      icon: 'fas fa-sitemap',
      route: '/system-tenants',
      section: 'Administration',
      superAdminOnly: true,
    },
    {
      label: 'Settings',
      icon: 'fas fa-sliders',
      route: '/settings',
      section: 'Administration',
      roles: ['super_admin', 'admin'],
    },
  ];

  navItems: NavItem[] = [];
  groupedSections: NavSection[] = [];

  private userSub?: Subscription;
  private filterSub?: Subscription;

  constructor(
    public router: Router,
    public themeService: ThemeService,
    public authService: AuthService,
    private reportsService: ReportsService,
    private propertyFilterService: PropertyFilterService,
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      const userRole = user?.role || '';
      this.navItems = this.allNavItems.filter((item) => {
        if (item.superAdminOnly) {
          return userRole === 'super_admin';
        }
        if (item.roles) {
          return item.roles.includes(userRole);
        }
        return true;
      });
      this.rebuildSections();
    });

    this.filterSub = this.propertyFilterService.selectedPropertyId$.subscribe((pid) => {
      const userRole = this.currentUser?.role || this.authService.getUser()?.role || '';
      if (userRole && userRole !== 'tenant') {
        this.loadSidebarBadges(pid || undefined);
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.filterSub?.unsubscribe();
  }

  private loadSidebarBadges(propertyId?: string): void {
    this.reportsService.getDashboard(propertyId).subscribe({
      next: (stats) => {
        this.badges = {
          vacantUnits: stats?.units?.vacant ?? stats?.properties?.available ?? 0,
          expiringLeases: stats?.leases?.expiringSoonCount ?? 0,
          pendingPayments: stats?.payments?.pending ?? 0,
          openDamages: stats?.damages?.reported ?? 0,
        };
      },
      error: () => {},
    });
  }

  onSearchChange(): void {
    this.rebuildSections();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.rebuildSections();
  }

  rebuildSections(): void {
    const query = this.searchQuery.trim().toLowerCase();
    const filtered = query
      ? this.navItems.filter(
          (i) =>
            i.label.toLowerCase().includes(query) ||
            i.section.toLowerCase().includes(query),
        )
      : this.navItems;

    const sectionOrder = [
      'Overview',
      'Portfolio & Leasing',
      'Finance & Billing',
      'Operations',
      'Administration',
    ];
    const groups: NavSection[] = [];

    for (const secTitle of sectionOrder) {
      const items = filtered.filter((i) => i.section === secTitle);
      if (items.length > 0) {
        groups.push({ id: secTitle, title: secTitle, items });
      }
    }
    this.groupedSections = groups;
  }

  trackBySection(_index: number, section: NavSection): string {
    return section.id;
  }

  trackByItem(_index: number, item: NavItem): string {
    return item.route;
  }

  toggleSection(sectionId: string): void {
    this.collapsedSections[sectionId] = !this.collapsedSections[sectionId];
  }

  isSectionCollapsed(sectionId: string): boolean {
    if (this.searchQuery.trim()) return false;
    return !!this.collapsedSections[sectionId];
  }

  getBadgeCount(item: NavItem): number {
    if (!item.badgeKey) return 0;
    return this.badges[item.badgeKey] || 0;
  }

  getBadgeClasses(item: NavItem): string {
    const active = this.isActive(item.route);
    if (active) {
      return 'bg-white/20 text-white';
    }
    switch (item.badgeType) {
      case 'danger':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
      case 'warning':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'success':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    }
  }

  formatRole(role?: string): string {
    if (!role) return 'Member';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
