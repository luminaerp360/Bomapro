import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { PropertiesListComponent } from './modules/properties/properties-list/properties-list.component';
import { PropertyDetailComponent } from './modules/properties/property-detail/property-detail.component';
import { PropertyFormComponent } from './modules/properties/property-form/property-form.component';
import { UnitsListComponent } from './modules/units/units-list/units-list.component';
import { UnitDetailComponent } from './modules/units/unit-detail/unit-detail.component';
import { TenantsListComponent } from './modules/property-tenants/tenants-list/tenants-list.component';
import { TenantDetailComponent } from './modules/property-tenants/tenant-detail/tenant-detail.component';
import { LeasesListComponent } from './modules/leases/leases-list/leases-list.component';
import { LeaseDetailComponent } from './modules/leases/lease-detail/lease-detail.component';
import { PaymentsListComponent } from './modules/payments/payments-list/payments-list.component';
import { PaymentDetailComponent } from './modules/payments/payment-detail/payment-detail.component';
import { InvoicesComponent } from './modules/invoices/invoices.component';
import { DamagesListComponent } from './modules/damages/damages-list/damages-list.component';
import { DamageDetailComponent } from './modules/damages/damage-detail/damage-detail.component';
import { ReportsComponent } from './modules/reports/reports.component';
import { UsersListComponent } from './modules/users/users-list/users-list.component';
import { SettingsComponent } from './modules/settings/settings.component';
import { SystemTenantsComponent } from './modules/system-tenants/system-tenants.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { RoleGuard } from './shared/guards/role.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'properties', component: PropertiesListComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager', 'agent'] } },
      { path: 'properties/new', component: PropertyFormComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager', 'agent'] } },
      { path: 'properties/:id', component: PropertyDetailComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager', 'agent'] } },
      { path: 'properties/:id/edit', component: PropertyFormComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager', 'agent'] } },
      { path: 'units', component: UnitsListComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager', 'agent'] } },
      { path: 'units/:id', component: UnitDetailComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager', 'agent'] } },
      { path: 'tenants', component: TenantsListComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager'] } },
      { path: 'tenants/:id', component: TenantDetailComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager'] } },
      { path: 'leases', component: LeasesListComponent },
      { path: 'leases/:id', component: LeaseDetailComponent },
      { path: 'payments', component: PaymentsListComponent },
      { path: 'payments/:id', component: PaymentDetailComponent },
      { path: 'invoices', component: InvoicesComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager', 'agent'] } },
      { path: 'damages', component: DamagesListComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager', 'agent'] } },
      { path: 'damages/:id', component: DamageDetailComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager', 'agent'] } },
      { path: 'reports', component: ReportsComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin', 'manager'] } },
      { path: 'users', component: UsersListComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin'] } },
      { path: 'settings', component: SettingsComponent, canActivate: [RoleGuard], data: { roles: ['super_admin', 'admin'] } },
      { path: 'system-tenants', component: SystemTenantsComponent, canActivate: [RoleGuard], data: { roles: ['super_admin'] } },
    ],
  },
  // Tenant Portal — lazy-loaded, separate auth
  {
    path: 'tenant-portal',
    loadChildren: () =>
      import('./modules/tenant-portal/tenant-portal.module').then(
        (m) => m.TenantPortalModule,
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
