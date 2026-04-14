import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TenantPortalService } from '../shared/services/tenant-portal.service';
import { PortalDamage } from '../shared/interfaces/portal.interfaces';

@Component({
  selector: 'app-portal-damages',
  templateUrl: './portal-damages.component.html',
  styleUrls: ['./portal-damages.component.scss'],
})
export class PortalDamagesComponent implements OnInit {
  damages: PortalDamage[] = [];
  form: FormGroup;
  loading = false;
  listLoading = true;
  submitted = false;
  error = '';
  activeTab: 'report' | 'history' = 'report';

  damageTypes = ['structural', 'electrical', 'plumbing', 'appliance', 'pest', 'fire', 'water', 'other'];
  severities = [
    { value: 'low', label: 'Low', icon: 'fas fa-circle', color: 'text-blue-500' },
    { value: 'medium', label: 'Medium', icon: 'fas fa-circle', color: 'text-yellow-500' },
    { value: 'high', label: 'High', icon: 'fas fa-circle', color: 'text-orange-500' },
    { value: 'critical', label: 'Critical', icon: 'fas fa-circle', color: 'text-red-600' },
  ];

  constructor(
    private fb: FormBuilder,
    private portalService: TenantPortalService,
  ) {
    this.form = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10)]],
      damageType: ['', Validators.required],
      severity: ['', Validators.required],
      location: ['', Validators.required],
      notes: [''],
    });
  }

  ngOnInit() {
    this.loadDamages();
  }

  loadDamages() {
    this.listLoading = true;
    this.portalService.getDamages().subscribe({
      next: (d) => { this.damages = d; this.listLoading = false; },
      error: () => (this.listLoading = false),
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    this.portalService.submitDamage(this.form.value).subscribe({
      next: () => {
        this.submitted = true;
        this.loading = false;
        this.loadDamages();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to submit damage report. Please try again.';
        this.loading = false;
      },
    });
  }

  reset() {
    this.submitted = false;
    this.form.reset();
    this.error = '';
  }

  severityLabel(v: string): string {
    return this.severities.find(s => s.value === v)?.label || v;
  }

  severityClass(v: string): string {
    const map: Record<string, string> = {
      low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    };
    return map[v] || 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400';
  }

  statusClass(v: string): string {
    const map: Record<string, string> = {
      reported: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      assessed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
      in_repair: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
      repaired: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
      deducted: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
      closed: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400',
    };
    return map[v] || 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400';
  }
}
