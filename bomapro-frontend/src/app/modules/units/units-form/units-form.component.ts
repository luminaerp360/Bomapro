import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UnitsService, Unit } from '../../../shared/services/units/units.service';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { Property, PaginatedResponse } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-units-form',
  templateUrl: './units-form.component.html',
  styleUrls: ['./units-form.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class UnitsFormComponent implements OnInit {
  @Input() isOpen = false;
  @Input() unit: Unit | null = null;
  @Input() propertyId = '';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Unit>();

  loading = false;
  loadingProperties = true;
  error = '';
  properties: Property[] = [];
  statusOptions = ['vacant', 'occupied', 'maintenance', 'reserved'];
  unitTypeOptions = ['bedsitter', 'single_room', 'one_bedroom', 'two_bedroom', 'three_bedroom'];
  rentCycleOptions = ['monthly', 'quarterly', 'annual'];
  floorOptions: (number | string)[] = [];

  form: Partial<Unit> = {
    propertyId: '',
    unitNumber: '',
    description: '',
    unitType: 'one_bedroom',
    floor: 0,
    status: 'vacant',
    rentAmount: 0,
    currency: 'KES',
    securityDeposit: 0,
    electricityMeterNumber: '',
    waterMeterNumber: '',
    rentCycle: 'monthly',
  };

  constructor(
    private unitsService: UnitsService,
    private propertiesService: PropertiesService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadProperties();
    if (this.unit) {
      this.form = { ...this.unit };
      this.updateFloorOptions();
    } else if (this.propertyId) {
      this.form.propertyId = this.propertyId;
      this.updateFloorOptions();
    }
  }

  ngOnChanges(): void {
    if (this.unit) {
      this.form = { ...this.unit };
      this.updateFloorOptions();
    } else {
      this.form.status = 'vacant';
      if (this.propertyId && !this.form.propertyId) {
        this.form.propertyId = this.propertyId;
        this.updateFloorOptions();
      }
    }
  }

  loadProperties(): void {
    this.loadingProperties = true;
    this.propertiesService.getAll(1, 1000).subscribe({
      next: (response: PaginatedResponse<Property>) => {
        this.properties = response.data;
        this.loadingProperties = false;
      },
      error: (err) => {
        console.error('Failed to load properties:', err);
        this.loadingProperties = false;
      },
    });
  }

  updateFloorOptions(): void {
    const selectedProperty = this.properties.find(p => p._id === this.form.propertyId);
    if (selectedProperty) {
      const floorsCount = selectedProperty.floors || 0;
      this.floorOptions = [];
      
      if (floorsCount === 0) {
        this.floorOptions = ['G'];
      } else {
        // Ground floor (0 or G), then 1, 2, 3, ..., floors
        this.floorOptions.push('G');
        for (let i = 1; i <= floorsCount; i++) {
          this.floorOptions.push(i);
        }
      }
    } else {
      this.floorOptions = ['G'];
    }
  }

  onPropertyChange(): void {
    this.updateFloorOptions();
    // Reset floor to G when property changes
    this.form.floor = 'G';
  }

  onSubmit(): void {
    if (!this.form.propertyId || !this.form.unitNumber || !this.form.rentAmount) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = '';

    const request = this.unit?._id
      ? this.unitsService.update(this.unit._id, this.form)
      : this.unitsService.create(this.form as Unit);

    request.subscribe({
      next: (savedUnit) => {
        this.loading = false;
        this.save.emit(savedUnit);
        this.closeModal();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to save unit';
      },
    });
  }

  closeModal(): void {
    this.form = {
      propertyId: this.propertyId || '',
      unitNumber: '',
      description: '',
      unitType: 'one_bedroom',
      floor: 'G',
      status: 'vacant',
      rentAmount: 0,
      currency: 'KES',
      securityDeposit: 0,
      electricityMeterNumber: '',
      waterMeterNumber: '',
      rentCycle: 'monthly',
    };
    this.error = '';
    this.close.emit();
  }

  get isEditMode(): boolean {
    return !!this.unit?._id;
  }

  getPropertyName(): string {
    const property = this.properties.find(p => p._id === this.form.propertyId);
    return property ? `${property.name} (${property.address})` : this.form.propertyId || '';
  }
}
