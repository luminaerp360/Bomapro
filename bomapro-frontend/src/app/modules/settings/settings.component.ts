import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { TenantsService } from '../../shared/services/tenants/tenants.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  presetColors = [
    '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ];

  mpesaClientId = '';
  mpesaSaving = false;
  mpesaSaved = false;
  mpesaError = '';
  showClientId = false;

  constructor(
    public themeService: ThemeService,
    public authService: AuthService,
    private tenantsService: TenantsService,
  ) {}

  ngOnInit() {
    const tenant = this.activeTenant as any;
    if (tenant?.mpesaClientId) {
      this.mpesaClientId = tenant.mpesaClientId;
    }
  }

  get user() { return this.authService.getUser(); }

  get activeTenant() {
    const activeTenantId = this.authService.getActiveTenantId();
    return this.authService.getTenants().find((tenant) => tenant._id === activeTenantId) || null;
  }

  get tenantCount(): number {
    return this.authService.getTenants().length;
  }

  toggleDarkMode(): void { this.themeService.toggleTheme(); }

  setAccentColor(color: string): void { this.themeService.setAccentColor(color); }

  saveMpesaSettings() {
    if (!this.activeTenant) return;
    this.mpesaSaving = true;
    this.mpesaError = '';
    this.mpesaSaved = false;
    this.tenantsService.update(this.activeTenant._id, { mpesaClientId: this.mpesaClientId } as any).subscribe({
      next: () => {
        this.mpesaSaving = false;
        this.mpesaSaved = true;
        // Update local cache
        const tenant = this.activeTenant as any;
        if (tenant) tenant.mpesaClientId = this.mpesaClientId;
        setTimeout(() => (this.mpesaSaved = false), 3000);
      },
      error: (err) => {
        this.mpesaSaving = false;
        this.mpesaError = err?.error?.message || 'Failed to save settings.';
      },
    });
  }
}
