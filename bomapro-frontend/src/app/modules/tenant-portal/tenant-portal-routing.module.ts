import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenantPortalLayoutComponent } from './layout/tenant-portal-layout.component';
import { PortalLoginComponent } from './auth/portal-login/portal-login.component';
import { SetupPasswordComponent } from './auth/setup-password/setup-password.component';
import { PortalDashboardComponent } from './dashboard/portal-dashboard.component';
import { PortalLeaseComponent } from './lease/portal-lease.component';
import { PortalPaymentsComponent } from './payments/portal-payments.component';
import { PortalInvoicesComponent } from './invoices/portal-invoices.component';
import { PortalMaintenanceRequestsComponent } from './maintenance-requests/portal-maintenance-requests.component';
import { PortalDamagesComponent } from './damages/portal-damages.component';
import { TenantPortalAuthGuard } from './shared/guards/tenant-portal-auth.guard';

const routes: Routes = [
  { path: 'login', component: PortalLoginComponent },
  { path: 'setup-password', component: SetupPasswordComponent },
  {
    path: '',
    component: TenantPortalLayoutComponent,
    canActivate: [TenantPortalAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PortalDashboardComponent },
      { path: 'lease', component: PortalLeaseComponent },
      { path: 'payments', component: PortalPaymentsComponent },
      { path: 'invoices', component: PortalInvoicesComponent },
      { path: 'maintenance-requests', component: PortalMaintenanceRequestsComponent },
      { path: 'damages', component: PortalDamagesComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TenantPortalRoutingModule {}
