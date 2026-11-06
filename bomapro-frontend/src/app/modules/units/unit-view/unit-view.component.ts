import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, style, transition, animate } from '@angular/animations';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { Unit } from '../../../shared/services/units/units.service';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { Property } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-unit-view',
  templateUrl: './unit-view.component.html',
  styleUrls: ['./unit-view.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in-out', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('220ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class UnitViewComponent implements OnInit {
  @Input() isOpen = false;
  @Input() unit: Unit | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Unit>();
  @Output() leaseUnit = new EventEmitter<Unit>();

  property: Property | null = null;
  loading = false;
  statusOptions = ['vacant', 'occupied', 'maintenance', 'reserved'];
  unitTypeOptions = ['bedsitter', 'single_room', 'one_bedroom', 'two_bedroom', 'three_bedroom'];

  constructor(
    public themeService: ThemeService,
    private propertiesService: PropertiesService,
  ) {}

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.closeModal();
    }
  }

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.isOpen && this.unit?.propertyId) {
      this.loadProperty();
    }
  }

  loadProperty(): void {
    if (!this.unit?.propertyId) return;
    this.loading = true;
    this.propertiesService.getById(this.unit.propertyId).subscribe({
      next: (property) => {
        this.property = property;
        this.loading = false;
      },
      error: (err) => {
        console.error('Load property error:', err);
        this.loading = false;
      },
    });
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'vacant':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
      case 'occupied':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
      case 'maintenance':
        return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300';
      case 'reserved':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'vacant':
        return 'fas fa-check-circle';
      case 'occupied':
        return 'fas fa-user-check';
      case 'maintenance':
        return 'fas fa-tools';
      case 'reserved':
        return 'fas fa-calendar-alt';
      default:
        return 'fas fa-question-circle';
    }
  }

  getUnitTypeLabel(type?: string): string {
    switch (type) {
      case 'bedsitter':
        return 'Bedsitter';
      case 'single_room':
        return 'Single Room';
      case 'one_bedroom':
        return '1 Bedroom';
      case 'two_bedroom':
        return '2 Bedrooms';
      case 'three_bedroom':
        return '3 Bedrooms';
      default:
        return type || 'N/A';
    }
  }

  getFloorLabel(floor?: number | string): string {
    if (floor === 'G' || floor === 0) return 'Ground Floor (G)';
    if (typeof floor === 'number') return `${floor}${floor === 1 ? 'st' : floor === 2 ? 'nd' : floor === 3 ? 'rd' : 'th'} Floor`;
    return String(floor);
  }

  closeModal(): void {
    this.close.emit();
  }

  onEdit(): void {
    if (this.unit) {
      this.edit.emit(this.unit);
    }
  }

  onLeaseUnit(): void {
    if (this.unit) {
      this.leaseUnit.emit(this.unit);
    }
  }
}
