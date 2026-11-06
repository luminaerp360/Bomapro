import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { PropertyFilterService } from '../../shared/services/property-filter/property-filter.service';
import { Tenant } from '../../shared/interfaces/models';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  showUserMenu = false;
  showColorPicker = false;
  showTenantMenu = false;
  showPropertyMenu = false;
  switchingTenant = false;
  tenantSwitchError = '';

  pageTitle = 'Dashboard';
  pageSubtitle = 'Portfolio overview & real-time metrics';
  pageIcon = 'fas fa-chart-pie';
  activeTenantName = 'No Organization';

  private routerSub?: Subscription;
  private tenantSub?: Subscription;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    public propertyFilterService: PropertyFilterService,
    private router: Router,
    private elementRef: ElementRef,
  ) {}

  ngOnInit(): void {
    this.propertyFilterService.loadProperties();
    this.updateActiveTenantName();
    this.updatePageMeta(this.router.url);

    this.tenantSub = this.authService.tenantList$.subscribe(() => {
      this.updateActiveTenantName();
    });

    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.closeAllMenus();
        this.updatePageMeta(e.urlAfterRedirects || e.url);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.tenantSub?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.closeAllMenus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeAllMenus();
  }

  closeAllMenus(): void {
    this.showPropertyMenu = false;
    this.showTenantMenu = false;
    this.showColorPicker = false;
    this.showUserMenu = false;
  }

  toggleMenu(menu: 'property' | 'tenant' | 'color' | 'user', event: MouseEvent): void {
    event.stopPropagation();
    const nextState = {
      property: menu === 'property' ? !this.showPropertyMenu : false,
      tenant: menu === 'tenant' ? !this.showTenantMenu : false,
      color: menu === 'color' ? !this.showColorPicker : false,
      user: menu === 'user' ? !this.showUserMenu : false,
    };
    this.showPropertyMenu = nextState.property;
    this.showTenantMenu = nextState.tenant;
    this.showColorPicker = nextState.color;
    this.showUserMenu = nextState.user;
  }

  private updatePageMeta(url: string): void {
    const clean = url.split('?')[0];
    const map: Array<{ prefix: string; title: string; subtitle: string; icon: string }> = [
      { prefix: '/dashboard', title: 'Dashboard', subtitle: 'Portfolio overview & real-time metrics', icon: 'fas fa-chart-pie' },
      { prefix: '/reports', title: 'Analytics & Reports', subtitle: 'Financial, occupancy & lease expiry insights', icon: 'fas fa-chart-line' },
      { prefix: '/properties', title: 'Properties', subtitle: 'Manage buildings, estates & property details', icon: 'fas fa-building' },
      { prefix: '/units', title: 'Units', subtitle: 'Track unit availability, rent rates & tenants', icon: 'fas fa-door-open' },
      { prefix: '/tenants', title: 'Tenants', subtitle: 'Directory of registered occupants & portal access', icon: 'fas fa-user-group' },
      { prefix: '/leases', title: 'Leases', subtitle: 'Active contracts, rent schedules & balances', icon: 'fas fa-file-contract' },
      { prefix: '/payments', title: 'Payments', subtitle: 'Rent collections, M-Pesa receipts & history', icon: 'fas fa-money-bill-transfer' },
      { prefix: '/invoices', title: 'Invoices', subtitle: 'Billing statements & downloadable receipts', icon: 'fas fa-file-invoice-dollar' },
      { prefix: '/damages', title: 'Damages & Repairs', subtitle: 'Maintenance tickets, assessments & repair costs', icon: 'fas fa-screwdriver-wrench' },
      { prefix: '/users', title: 'Users & Roles', subtitle: 'Team accounts & role-based permissions', icon: 'fas fa-user-shield' },
      { prefix: '/system-tenants', title: 'Organizations', subtitle: 'System-wide workspaces & plans', icon: 'fas fa-sitemap' },
      { prefix: '/settings', title: 'Settings', subtitle: 'Organization profile & M-Pesa integration', icon: 'fas fa-sliders' },
    ];
    const matched = map.find((m) => clean.startsWith(m.prefix));
    if (matched) {
      this.pageTitle = matched.title;
      this.pageSubtitle = matched.subtitle;
      this.pageIcon = matched.icon;
    } else {
      this.pageTitle = 'Rental Management';
      this.pageSubtitle = 'Bomapro Property Management ERP';
      this.pageIcon = 'fas fa-house-chimney';
    }
  }

  get isTenant(): boolean {
    return this.authService.getUser()?.role === 'tenant';
  }

  onAccentChange(hex: string): void {
    this.themeService.setAccentColor(hex);
  }

  switchTenant(tenant: Tenant): void {
    const tenantId = (tenant as any)?._id || (tenant as any)?.id || '';
    if (!tenantId) {
      this.tenantSwitchError = 'This organization cannot be switched right now. Please refresh and try again.';
      return;
    }

    if (tenantId === this.authService.getActiveTenantId()) {
      this.showTenantMenu = false;
      return;
    }

    this.tenantSwitchError = '';
    this.switchingTenant = true;
    this.authService.switchTenant(tenantId).subscribe({
      next: () => {
        this.switchingTenant = false;
        this.showTenantMenu = false;
        window.location.reload();
      },
      error: (err) => {
        this.switchingTenant = false;
        this.tenantSwitchError = err?.error?.message || 'Unable to switch organization. Please try again.';
      },
    });
  }

  private updateActiveTenantName(): void {
    const tenants = this.authService.getTenants();
    const activeId = this.authService.getActiveTenantId();
    const active = tenants.find((t) => t._id === activeId) || tenants[0];
    this.activeTenantName = active?.name || 'No Organization';
  }

  getActiveTenantName(): string {
    return this.activeTenantName;
  }

  formatRole(role?: string): string {
    if (!role) return 'User';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  canSwitchTenants(tenants: Tenant[] | null): boolean {
    return (tenants?.length || 0) > 1;
  }

  logout(): void {
    this.closeAllMenus();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
