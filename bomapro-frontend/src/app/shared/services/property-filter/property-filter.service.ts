import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PropertiesService } from '../properties/properties.service';
import { Property } from '../../interfaces/models';

const STORAGE_KEY = 'bomapro_property_filter';

@Injectable({ providedIn: 'root' })
export class PropertyFilterService {
  private _selectedId$ = new BehaviorSubject<string>(
    typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) || '') : '',
  );
  readonly selectedPropertyId$ = this._selectedId$.asObservable();

  private _properties$ = new BehaviorSubject<Property[]>([]);
  readonly properties$ = this._properties$.asObservable();

  constructor(private propertiesService: PropertiesService) {
    this.loadProperties();
  }

  get selectedPropertyId(): string {
    return this._selectedId$.getValue();
  }

  setProperty(id: string): void {
    this._selectedId$.next(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  getSelectedProperty(): Property | null {
    const id = this._selectedId$.getValue();
    if (!id) return null;
    return this._properties$.getValue().find((p) => p._id === id) || null;
  }

  getSelectedPropertyName(): string {
    const prop = this.getSelectedProperty();
    return prop ? prop.name : 'All Properties';
  }

  loadProperties(): void {
    this.propertiesService.getAll(1, 200).subscribe({
      next: (res) => {
        const props = res.data || [];
        this._properties$.next(props);
        // Clear stored selection if that property no longer exists
        const stored = this._selectedId$.getValue();
        if (stored && !props.find((p) => p._id === stored)) {
          this.setProperty('');
        }
      },
      error: () => {},
    });
  }
}
