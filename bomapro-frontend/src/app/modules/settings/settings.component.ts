import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { TenantsService } from '../../shared/services/tenants/tenants.service';
import { PaymentsService } from '../../shared/services/payments/payments.service';
import { Tenant } from '../../shared/interfaces/models';

export type SettingsTab = 'organization' | 'notifications' | 'smtp' | 'billing' | 'appearance';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  activeTab: SettingsTab = 'notifications';

  presetColors = [
    '#10b981', '#059669', '#3b82f6', '#6366f1', '#8b5cf6',
    '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16',
  ];

  loadingTenant = false;
  saving = false;
  saveSuccess = '';
  saveError = '';

  // Organization Profile
  orgForm = {
    name: '',
    contactEmail: '',
    billingEmail: '',
    supportPhone: '',
    companyAddress: '',
    logoUrl: '',
  };

  // Multi-recipient Notification Emails & Preferences
  notificationEmails: string[] = [];
  newEmailInput = '';
  notificationPreferences = {
    emailTenantOnPayment: true,
    emailAdminsOnPayment: true,
    emailTenantOnInvoiceDue: true,
    emailAdminsOnOverdue: true,
    publicPortalUrl: 'https://ecommerse.lumina360.tech',
  };

  // Custom / Default SMTP Configuration
  smtpConfig = {
    useCustomSmtp: false,
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: '',
    pass: '',
    fromEmail: '',
    fromName: '',
  };
  showSmtpPassword = false;

  // Test Email State
  testEmailRecipient = '';
  sendingTestEmail = false;
  testEmailResult = '';
  testEmailError = '';

  // Bulk Reminder Trigger from Settings
  sendingBulkReminders = false;

  // M-Pesa & Billing Defaults
  mpesaClientId = '';
  showClientId = false;
  billingSettings = {
    defaultCurrency: 'KES',
    defaultPaymentDueDay: 5,
    defaultGracePeriodDays: 5,
    defaultLeaseDurationMonths: 12,
    paybillOrTillNumber: '',
    bankAccountDetails: '',
    paymentInstructions: '',
  };

  constructor(
    public themeService: ThemeService,
    public authService: AuthService,
    private tenantsService: TenantsService,
    private paymentsService: PaymentsService,
  ) {}

  ngOnInit(): void {
    this.loadOrganizationSettings();
  }

  get user() {
    return this.authService.getUser();
  }

  get activeTenant(): Tenant | null {
    const activeTenantId = this.authService.getActiveTenantId();
    return this.authService.getTenants().find((tenant) => tenant._id === activeTenantId) || null;
  }

  get tenantCount(): number {
    return this.authService.getTenants().length;
  }

  loadOrganizationSettings(): void {
    const current = this.activeTenant;
    if (!current?._id) return;

    this.hydrateFromTenant(current);
    this.loadingTenant = true;
    this.tenantsService.getById(current._id).subscribe({
      next: (fresh) => {
        this.loadingTenant = false;
        this.hydrateFromTenant(fresh);
      },
      error: () => {
        this.loadingTenant = false;
      },
    });
  }

  private hydrateFromTenant(t: Tenant): void {
    this.orgForm = {
      name: t.name || '',
      contactEmail: t.contactEmail || '',
      billingEmail: t.billingEmail || '',
      supportPhone: t.supportPhone || '',
      companyAddress: t.companyAddress || '',
      logoUrl: t.logoUrl || '',
    };

    this.mpesaClientId = t.mpesaClientId || '';
    this.notificationEmails = Array.isArray(t.notificationEmails) ? [...t.notificationEmails] : [];

    this.notificationPreferences = {
      emailTenantOnPayment: t.notificationPreferences?.emailTenantOnPayment !== false,
      emailAdminsOnPayment: t.notificationPreferences?.emailAdminsOnPayment !== false,
      emailTenantOnInvoiceDue: t.notificationPreferences?.emailTenantOnInvoiceDue !== false,
      emailAdminsOnOverdue: t.notificationPreferences?.emailAdminsOnOverdue !== false,
      publicPortalUrl: t.notificationPreferences?.publicPortalUrl || 'https://ecommerse.lumina360.tech',
    };

    this.smtpConfig = {
      useCustomSmtp: Boolean(t.smtpConfig?.useCustomSmtp),
      host: t.smtpConfig?.host || 'smtp.gmail.com',
      port: Number(t.smtpConfig?.port || 465),
      secure: t.smtpConfig?.secure !== undefined ? Boolean(t.smtpConfig.secure) : true,
      user: t.smtpConfig?.user || '',
      pass: t.smtpConfig?.pass || '',
      fromEmail: t.smtpConfig?.fromEmail || '',
      fromName: t.smtpConfig?.fromName || t.name || '',
    };

    this.billingSettings = {
      defaultCurrency: t.billingSettings?.defaultCurrency || 'KES',
      defaultPaymentDueDay: Number(t.billingSettings?.defaultPaymentDueDay || 5),
      defaultGracePeriodDays: Number(t.billingSettings?.defaultGracePeriodDays || 5),
      defaultLeaseDurationMonths: Number(t.billingSettings?.defaultLeaseDurationMonths || 12),
      paybillOrTillNumber: t.billingSettings?.paybillOrTillNumber || '',
      bankAccountDetails: t.billingSettings?.bankAccountDetails || '',
      paymentInstructions: t.billingSettings?.paymentInstructions || '',
    };

    if (!this.testEmailRecipient) {
      this.testEmailRecipient =
        this.notificationEmails[0] || t.billingEmail || t.contactEmail || this.user?.email || '';
    }
  }

  addNotificationEmail(): void {
    const raw = (this.newEmailInput || '').trim();
    if (!raw) return;

    const parts = raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (parts.length === 0) {
      this.showError('Please enter a valid email address (e.g. finance@company.com)');
      return;
    }

    for (const email of parts) {
      if (!this.notificationEmails.includes(email)) {
        this.notificationEmails.push(email);
      }
    }
    this.newEmailInput = '';
  }

  removeNotificationEmail(email: string): void {
    this.notificationEmails = this.notificationEmails.filter((e) => e !== email);
  }

  onEmailInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addNotificationEmail();
    }
  }

  saveAllSettings(sectionLabel = 'Settings'): void {
    if (!this.activeTenant?._id) return;

    // If user typed an email in the input box without clicking Add, add it automatically before saving
    if (this.newEmailInput.trim()) {
      this.addNotificationEmail();
    }

    this.saving = true;
    this.saveError = '';
    this.saveSuccess = '';

    const payload: Partial<Tenant> = {
      name: this.orgForm.name.trim() || this.activeTenant.name,
      contactEmail: this.orgForm.contactEmail.trim(),
      billingEmail: this.orgForm.billingEmail.trim(),
      supportPhone: this.orgForm.supportPhone.trim(),
      companyAddress: this.orgForm.companyAddress.trim(),
      logoUrl: this.orgForm.logoUrl.trim(),
      mpesaClientId: this.mpesaClientId.trim(),
      notificationEmails: this.notificationEmails,
      notificationPreferences: {
        ...this.notificationPreferences,
        publicPortalUrl: (this.notificationPreferences.publicPortalUrl || '').trim(),
      },
      smtpConfig: {
        ...this.smtpConfig,
        host: (this.smtpConfig.host || 'smtp.gmail.com').trim(),
        port: Number(this.smtpConfig.port || 465),
        user: (this.smtpConfig.user || '').trim(),
        fromEmail: (this.smtpConfig.fromEmail || '').trim(),
        fromName: (this.smtpConfig.fromName || '').trim(),
      },
      billingSettings: {
        ...this.billingSettings,
        defaultPaymentDueDay: Number(this.billingSettings.defaultPaymentDueDay || 5),
        defaultGracePeriodDays: Number(this.billingSettings.defaultGracePeriodDays || 5),
        defaultLeaseDurationMonths: Number(this.billingSettings.defaultLeaseDurationMonths || 12),
      },
    };

    this.tenantsService.update(this.activeTenant._id, payload).subscribe({
      next: (updated) => {
        this.saving = false;
        this.hydrateFromTenant(updated);
        // Update local cached tenant object
        const localTenant = this.activeTenant as any;
        if (localTenant) {
          Object.assign(localTenant, updated);
        }
        this.showSuccess(`${sectionLabel} saved successfully!`);
      },
      error: (err) => {
        this.saving = false;
        this.showError(err?.error?.message || 'Failed to save settings.');
      },
    });
  }

  sendTestEmailNow(): void {
    if (!this.activeTenant?._id) return;
    this.sendingTestEmail = true;
    this.testEmailResult = '';
    this.testEmailError = '';

    // First save current SMTP & Notification settings so the backend tests with the latest form state
    const payload: Partial<Tenant> = {
      notificationEmails: this.notificationEmails,
      smtpConfig: {
        ...this.smtpConfig,
        host: (this.smtpConfig.host || 'smtp.gmail.com').trim(),
        port: Number(this.smtpConfig.port || 465),
        user: (this.smtpConfig.user || '').trim(),
        fromEmail: (this.smtpConfig.fromEmail || '').trim(),
        fromName: (this.smtpConfig.fromName || '').trim(),
      },
    };

    this.tenantsService.update(this.activeTenant._id, payload).subscribe({
      next: () => {
        this.tenantsService
          .sendTestEmail(this.activeTenant!._id, this.testEmailRecipient.trim() || undefined)
          .subscribe({
            next: (res) => {
              this.sendingTestEmail = false;
              this.testEmailResult = res.message || 'Test email sent successfully!';
            },
            error: (err) => {
              this.sendingTestEmail = false;
              this.testEmailError =
                err?.error?.message || 'Failed to send test email. Please verify your SMTP credentials.';
            },
          });
      },
      error: (err) => {
        this.sendingTestEmail = false;
        this.testEmailError = err?.error?.message || 'Could not save SMTP settings before testing.';
      },
    });
  }

  triggerBulkRemindersNow(): void {
    this.sendingBulkReminders = true;
    this.paymentsService.sendBulkReminders('all_due').subscribe({
      next: (res) => {
        this.sendingBulkReminders = false;
        this.showSuccess(res.message || 'Due & overdue reminders sent!');
      },
      error: (err) => {
        this.sendingBulkReminders = false;
        this.showError(err?.error?.message || 'Failed to send bulk reminders');
      },
    });
  }

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  setAccentColor(color: string): void {
    this.themeService.setAccentColor(color);
  }

  private showSuccess(msg: string): void {
    this.saveSuccess = msg;
    setTimeout(() => {
      if (this.saveSuccess === msg) this.saveSuccess = '';
    }, 4500);
  }

  private showError(msg: string): void {
    this.saveError = msg;
    setTimeout(() => {
      if (this.saveError === msg) this.saveError = '';
    }, 6000);
  }
}
