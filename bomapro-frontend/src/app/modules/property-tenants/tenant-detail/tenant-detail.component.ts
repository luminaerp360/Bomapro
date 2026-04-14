import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { LeasesService } from '../../../shared/services/leases/leases.service';
import { PaymentsService } from '../../../shared/services/payments/payments.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { PropertyTenant, Lease, Payment } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tenant-detail.component.html',
  styleUrls: ['./tenant-detail.component.scss'],
})
export class TenantDetailComponent implements OnInit {
  tenant: PropertyTenant | null = null;
  leases: Lease[] = [];
  payments: Payment[] = [];
  loading = true;
  reminderSending = false;
  reminderMsg = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private tenantsService: PropertyTenantsService,
    private leasesService: LeasesService,
    private paymentsService: PaymentsService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string): void {
    this.tenantsService.getById(id).subscribe({
      next: (t) => {
        this.tenant = t;
        this.loading = false;
        this.leasesService.getByTenant(id).subscribe((l) => (this.leases = l));
        this.paymentsService.getByTenant(id).subscribe((p) => (this.payments = p));
      },
      error: () => { this.loading = false; },
    });
  }

  goBack(): void { this.router.navigate(['/tenants']); }

  deleteTenant(): void {
    if (!this.tenant || !confirm('Delete this tenant?')) return;
    this.tenantsService.delete(this.tenant._id).subscribe(() => this.goBack());
  }

  sendReminder(): void {
    if (!this.tenant) return;
    this.reminderSending = true;
    this.reminderMsg = '';
    this.paymentsService.sendReminder(this.tenant._id).subscribe({
      next: (r) => {
        this.reminderMsg = r.message || 'Reminder sent';
        this.reminderSending = false;
        setTimeout(() => (this.reminderMsg = ''), 4000);
      },
      error: () => (this.reminderSending = false),
    });
  }
}
