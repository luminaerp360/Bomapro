import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Layout
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';

// Auth
import { LoginComponent } from './modules/auth/login/login.component';

// Dashboard
import { DashboardComponent } from './modules/dashboard/dashboard.component';

// Properties
import { PropertiesListComponent } from './modules/properties/properties-list/properties-list.component';
import { PropertyDetailComponent } from './modules/properties/property-detail/property-detail.component';
import { PropertyFormComponent } from './modules/properties/property-form/property-form.component';
import { PropertyViewComponent } from './modules/properties/property-view/property-view.component';

// Units
import { UnitsListComponent } from './modules/units/units-list/units-list.component';
import { UnitDetailComponent } from './modules/units/unit-detail/unit-detail.component';
import { UnitsFormComponent } from './modules/units/units-form/units-form.component';
import { UnitViewComponent } from './modules/units/unit-view/unit-view.component';

// Property Tenants
import { TenantsListComponent } from './modules/property-tenants/tenants-list/tenants-list.component';
import { TenantDetailComponent } from './modules/property-tenants/tenant-detail/tenant-detail.component';

// Leases
import { LeasesListComponent } from './modules/leases/leases-list/leases-list.component';
import { LeaseDetailComponent } from './modules/leases/lease-detail/lease-detail.component';
import { LeaseFormComponent } from './modules/leases/lease-form/lease-form.component';

// Payments
import { PaymentsListComponent } from './modules/payments/payments-list/payments-list.component';
import { PaymentDetailComponent } from './modules/payments/payment-detail/payment-detail.component';

// Invoices
import { InvoicesComponent } from './modules/invoices/invoices.component';

// Damages
import { DamagesListComponent } from './modules/damages/damages-list/damages-list.component';
import { DamageDetailComponent } from './modules/damages/damage-detail/damage-detail.component';

// Reports
import { ReportsComponent } from './modules/reports/reports.component';

// Users
import { UsersListComponent } from './modules/users/users-list/users-list.component';

// Settings
import { SettingsComponent } from './modules/settings/settings.component';

// System Tenants
import { SystemTenantsComponent } from './modules/system-tenants/system-tenants.component';

// Shared
import { ColorPickerComponent } from './shared/components/color-picker/color-picker.component';
import { StkPushComponent } from './shared/components/stk-push/stk-push.component';

// Interceptors
import { AuthInterceptor } from './shared/interceptors/auth.interceptor';
import { TenantPortalAuthInterceptor } from './modules/tenant-portal/shared/interceptors/tenant-portal-auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    MainLayoutComponent,
    SidebarComponent,
    HeaderComponent,
    LoginComponent,
    DashboardComponent,
    PaymentsListComponent,
    PaymentDetailComponent,
    InvoicesComponent,
    DamagesListComponent,
    DamageDetailComponent,
    ReportsComponent,
    UsersListComponent,
    SettingsComponent,
    SystemTenantsComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    ColorPickerComponent,
    StkPushComponent,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: TenantPortalAuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
