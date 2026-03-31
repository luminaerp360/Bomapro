import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RentiumUserRole } from './schemas/rentium-user.schema';

@Controller('api/init')
export class InitController {
  constructor(private readonly authService: AuthService) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedDatabase() {
    const users = [
      {
        name: 'Super Admin',
        email: 'superadmin@bomapro.co.ke',
        password: 'SuperAdmin@2026',
        role: 'super_admin',
        permissions: [
          'view_dashboard',
          'view_properties',
          'create_properties',
          'edit_properties',
          'delete_properties',
          'view_tenants',
          'create_tenants',
          'edit_tenants',
          'delete_tenants',
          'view_leases',
          'create_leases',
          'edit_leases',
          'delete_leases',
          'view_payments',
          'create_payments',
          'edit_payments',
          'delete_payments',
          'view_damages',
          'create_damages',
          'edit_damages',
          'delete_damages',
          'view_reports',
          'export_reports',
          'view_users',
          'create_users',
          'edit_users',
          'delete_users',
          'view_maintenance_requests',
          'create_maintenance_requests',
          'edit_maintenance_requests',
          'delete_maintenance_requests',
        ],
      },
      {
        name: 'Property Manager',
        email: 'manager@bomapro.co.ke',
        password: 'Manager@2026',
        role: 'manager',
        permissions: [
          'view_dashboard',
          'view_properties',
          'create_properties',
          'edit_properties',
          'view_tenants',
          'create_tenants',
          'edit_tenants',
          'view_leases',
          'create_leases',
          'edit_leases',
          'view_payments',
          'create_payments',
          'view_damages',
          'create_damages',
          'view_maintenance_requests',
          'create_maintenance_requests',
          'edit_maintenance_requests',
        ],
      },
      {
        name: 'Test Tenant User',
        email: 'tenant@bomapro.co.ke',
        password: 'Tenant@2026',
        role: 'tenant',
        permissions: [
          'view_dashboard',
          'view_leases',
          'view_lease_details',
          'sign_leases',
          'view_payments',
          'create_payments',
          'view_maintenance_requests',
          'create_maintenance_requests',
          'edit_maintenance_requests',
        ],
      },
      {
        name: 'Accountant',
        email: 'accountant@bomapro.co.ke',
        password: 'Accountant@2026',
        role: 'admin',
        permissions: [
          'view_dashboard',
          'view_payments',
          'view_payment_details',
          'export_payment_reports',
          'view_reports',
          'export_reports',
          'view_properties',
          'view_leases',
        ],
      },
    ];

    const seededUsers = [];
    for (const user of users) {
      const result = await this.authService.register({
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role as RentiumUserRole,
      });

      // Update with additional fields if the auth service schema supports it
      seededUsers.push({
        email: user.email,
        role: user.role,
        status: 'created',
      });
    }

    return {
      success: true,
      message: 'Database seeded successfully',
      users: seededUsers,
      credentials: users.map((u) => ({
        email: u.email,
        password: u.password,
        role: u.role,
      })),
    };
  }
}
