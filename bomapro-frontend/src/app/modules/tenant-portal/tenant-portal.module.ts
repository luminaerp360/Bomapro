import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TenantPortalRoutingModule } from './tenant-portal-routing.module';
import { TenantPortalLayoutComponent } from './layout/tenant-portal-layout.component';
import { PortalLoginComponent } from './auth/portal-login/portal-login.component';
import { SetupPasswordComponent } from './auth/setup-password/setup-password.component';
import { PortalDashboardComponent } from './dashboard/portal-dashboard.component';
import { PortalLeaseComponent } from './lease/portal-lease.component';
import { PortalPaymentsComponent } from './payments/portal-payments.component';
import { PortalInvoicesComponent } from './invoices/portal-invoices.component';
import { PortalMaintenanceRequestsComponent } from './maintenance-requests/portal-maintenance-requests.component';
import { PortalThemeSettingsComponent } from './layout/portal-theme-settings/portal-theme-settings.component';
import { StkPushComponent } from '../../shared/components/stk-push/stk-push.component';

@NgModule({
  declarations: [
    TenantPortalLayoutComponent,
    PortalLoginComponent,
    SetupPasswordComponent,
    PortalDashboardComponent,
    PortalLeaseComponent,
    PortalPaymentsComponent,
    PortalInvoicesComponent,
    PortalMaintenanceRequestsComponent,
    PortalThemeSettingsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TenantPortalRoutingModule,
    StkPushComponent,
  ],
  providers: [],
})
export class TenantPortalModule {}
