import { Component, OnInit } from '@angular/core';
import { UsersService, SaveUserPayload } from '../../../shared/services/users/users.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { BomoproUser, PermissionsResponse, Tenant } from '../../../shared/interfaces/models';

type UserRole = BomoproUser['role'];

interface UserFormModel {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  isActive: boolean;
  tenantIds: string[];
}

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  users: BomoproUser[] = [];
  loading = true;
  search = '';
  showUserForm = false;
  showPermissions = false;
  savingUser = false;
  savingPermissions = false;
  editingUser: BomoproUser | null = null;
  selectedUserForPermissions: BomoproUser | null = null;
  organizations: Tenant[] = [];
  roles: UserRole[] = ['super_admin', 'admin', 'manager', 'agent'];
  permissionsData: PermissionsResponse | null = null;
  permissionDraft: string[] = [];

  userForm: UserFormModel = this.createEmptyForm();

  constructor(
    private usersService: UsersService,
    public authService: AuthService,
    public themeService: ThemeService,
  ) {}

  get isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  get availableRoles(): UserRole[] {
    return this.isSuperAdmin
      ? ['super_admin', 'admin', 'manager', 'agent']
      : ['admin', 'manager', 'agent'];
  }

  ngOnInit(): void {
    this.organizations = this.authService.getTenants();
    this.loadUsers();
    this.usersService.getPermissions().subscribe((p) => (this.permissionsData = p));
    this.authService.tenantList$.subscribe((tenants) => {
      this.organizations = tenants;
      this.userForm.tenantIds = this.userForm.tenantIds.filter((tenantId) => tenants.some((tenant) => tenant._id === tenantId));
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService.getAll(1, 50, this.search).subscribe({
      next: (res) => {
        const isSuper = this.isSuperAdmin;
        this.users = (res.data || []).filter((user) => isSuper || user.role !== 'super_admin');
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch(): void {
    this.loadUsers();
  }

  openCreate(): void {
    this.editingUser = null;
    this.userForm = this.createEmptyForm();
    this.showUserForm = true;
  }

  openEdit(user: BomoproUser): void {
    if (user.role === 'super_admin' && !this.isSuperAdmin) {
      return;
    }
    this.editingUser = user;
    this.userForm = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
      isActive: user.isActive,
      tenantIds: [...(user.tenantIds || [])],
    };
    this.showUserForm = true;
  }

  saveUser(): void {
    if (!this.userForm.name || !this.userForm.email) {
      return;
    }

    if (!this.editingUser && !this.userForm.password) {
      return;
    }

    if (this.userForm.role === 'super_admin' && !this.isSuperAdmin) {
      return;
    }

    if (this.userForm.role !== 'super_admin' && !this.userForm.tenantIds.length && this.organizations.length) {
      return;
    }

    const payload: SaveUserPayload = {
      name: this.userForm.name.trim(),
      email: this.userForm.email.trim(),
      phone: this.userForm.phone.trim(),
      role: this.userForm.role,
      isActive: this.userForm.isActive,
      tenantIds: [...new Set(this.userForm.tenantIds)],
    };

    if (this.userForm.password.trim()) {
      payload.password = this.userForm.password.trim();
    }

    this.savingUser = true;
    const request = this.editingUser
      ? this.usersService.update(this.editingUser._id, payload)
      : this.usersService.create(payload);

    request.subscribe({
      next: () => {
        this.savingUser = false;
        this.showUserForm = false;
        this.loadUsers();
      },
      error: () => {
        this.savingUser = false;
      },
    });
  }

  approve(userId: string): void {
    const target = this.users.find((u) => u._id === userId);
    if (target?.role === 'super_admin' && !this.isSuperAdmin) return;
    this.usersService.approve(userId).subscribe(() => this.loadUsers());
  }

  reject(userId: string): void {
    const target = this.users.find((u) => u._id === userId);
    if (target?.role === 'super_admin' && !this.isSuperAdmin) return;
    if (!confirm('Reject this user?')) return;
    this.usersService.reject(userId).subscribe(() => this.loadUsers());
  }

  deleteUser(userId: string): void {
    const target = this.users.find((u) => u._id === userId);
    if (target?.role === 'super_admin' && !this.isSuperAdmin) return;
    if (!confirm('Delete this user?')) return;
    this.usersService.delete(userId).subscribe(() => this.loadUsers());
  }

  openPermissionsModal(user: BomoproUser): void {
    if (user.role === 'super_admin' && !this.isSuperAdmin) {
      return;
    }
    this.selectedUserForPermissions = user;
    this.permissionDraft = [...(user.permissions || [])];
    this.showPermissions = true;
  }

  togglePermission(permission: string): void {
    const index = this.permissionDraft.indexOf(permission);
    if (index > -1) {
      this.permissionDraft.splice(index, 1);
      return;
    }

    this.permissionDraft.push(permission);
  }

  savePermissions(): void {
    if (!this.selectedUserForPermissions) {
      return;
    }

    this.savingPermissions = true;
    this.usersService.update(this.selectedUserForPermissions._id, { permissions: [...this.permissionDraft] }).subscribe({
      next: () => {
        this.savingPermissions = false;
        this.showPermissions = false;
        this.loadUsers();
      },
      error: () => {
        this.savingPermissions = false;
      },
    });
  }

  toggleOrganization(tenantId: string): void {
    const current = new Set(this.userForm.tenantIds);
    if (current.has(tenantId)) {
      current.delete(tenantId);
    } else {
      current.add(tenantId);
    }
    this.userForm.tenantIds = [...current];
  }

  getUserOrganizations(user: BomoproUser): Tenant[] {
    const ids = new Set(user.tenantIds || []);
    return this.organizations.filter((tenant) => ids.has(tenant._id));
  }

  isOrganizationSelected(tenantId: string): boolean {
    return this.userForm.tenantIds.includes(tenantId);
  }

  trackByUser(index: number, user: BomoproUser): string {
    return user._id;
  }

  getRoleClasses(role: string): string {
    const map: Record<string, string> = {
      super_admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      agent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    return map[role] || '';
  }

  private createEmptyForm(): UserFormModel {
    return {
      name: '',
      email: '',
      phone: '',
      role: 'agent',
      password: '',
      isActive: true,
      tenantIds: this.getDefaultTenantIds(),
    };
  }

  private getDefaultTenantIds(): string[] {
    const activeTenantId = this.authService.getActiveTenantId();
    if (activeTenantId) {
      return [activeTenantId];
    }

    if (this.organizations.length === 1) {
      return [this.organizations[0]._id];
    }

    return [];
  }
}
