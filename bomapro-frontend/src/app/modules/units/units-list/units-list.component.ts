import * as XLSX from 'xlsx';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UnitsService, Unit, PaginatedResponse } from '../../../shared/services/units/units.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { PropertyFilterService } from '../../../shared/services/property-filter/property-filter.service';
import { Property } from '../../../shared/interfaces/models';
import { UnitViewComponent } from '../unit-view/unit-view.component';
import { UnitsFormComponent } from '../units-form/units-form.component';

@Component({
  selector: 'app-units-list',
  templateUrl: './units-list.component.html',
  styleUrls: ['./units-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UnitViewComponent, UnitsFormComponent],
})
export class UnitsListComponent implements OnInit, OnDestroy {
  units: Unit[] = [];
  loading = true;
  search = '';
  propertyIdFilter = ''; // User-selected property filter
  urlPropertyId = ''; // URL-driven property scope
  statusFilter = '';
  unitTypeFilter = '';
  floorFilter = '';
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;
  propertyMap: { [key: string]: string } = {}; // Cache property names
  propertyOptions: Pick<Property, '_id' | 'name'>[] = [];
  floorOptions: (string | number)[] = [];
  isTenant = false;
  propertyOptionsLoaded = false;

  // Stats
  totalUnits = 0;
  occupiedUnits = 0;
  vacantUnits = 0;
  maintenanceUnits = 0;

  statusOptions = ['vacant', 'occupied', 'maintenance', 'reserved'];
  unitTypeOptions = ['bedsitter', 'single_room', 'one_bedroom', 'two_bedroom', 'three_bedroom'];

  // Modal state
  formModalOpen = false;
  viewModalOpen = false;
  selectedUnit: Unit | null = null;

  // Bulk Import state
  importModalOpen = false;
  importActiveTab: 'file' | 'paste' = 'file';
  importFileName = '';
  importRawText = '';
  parsedImportRows: { property: string; unitNumber: string; rentAmount: number }[] = [];
  isImporting = false;
  importError = '';
  importSuccessMessage = '';

  private filterSub: Subscription | null = null;

  constructor(
    private unitsService: UnitsService,
    private propertiesService: PropertiesService,
    public themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private propertyFilterService: PropertyFilterService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isTenant = user?.role === 'tenant';

    // Load properties first, then subscribe to route params
    this.loadPropertyOptions();

    this.filterSub = this.propertyFilterService.selectedPropertyId$.subscribe(id => {
      this.propertyIdFilter = id;
      this.page = 1;
      this.loadUnits();
    });

    this.route.queryParams.subscribe((params) => {
      this.urlPropertyId = params['propertyId'] || '';
      this.page = 1;
      this.loadUnits();
    });
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  loadUnits(): void {
    this.loading = true;
    // Use URL property scope first, then fall back to user filter
    const propertyIdToSend = this.urlPropertyId || this.propertyIdFilter || undefined;
    
    // Ensure floor filter is properly converted to string or undefined
    let floorToSend: string | undefined;
    if (this.floorFilter !== null && this.floorFilter !== undefined && this.floorFilter !== '') {
      floorToSend = String(this.floorFilter);
    }
    
    console.log('Loading units with filters:', { propertyIdToSend, statusFilter: this.statusFilter, unitTypeFilter: this.unitTypeFilter, floor: floorToSend });
    
    this.unitsService
      .getAll(
        this.page,
        this.limit,
        propertyIdToSend,
        this.statusFilter || undefined,
        this.search || undefined,
        this.unitTypeFilter || undefined,
        floorToSend,
      )
      .subscribe({
        next: (res) => {
          // If tenant, filter to show only their units
          if (this.isTenant) {
            const user = this.authService.getUser();
            this.units = res.data.filter((unit: any) => {
              // Show units where the tenant has an active lease or property tenancy
              return unit.currentTenantId === user?._id;
            });
          } else {
            this.units = res.data;
            this.total = res.total !== undefined ? res.total : res.data.length;
            this.totalPages = res.totalPages !== undefined ? res.totalPages : Math.ceil(this.total / this.limit);
          }
          this.updateFloorOptions();
          this.calculateStats();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  loadPropertyOptions(): void {
    this.propertiesService.getAll(1, 1000).subscribe({
      next: (res) => {
        this.propertyOptions = res.data.map((prop) => ({
          _id: prop._id,
          name: prop.name,
        }));
        this.propertyOptions.forEach((prop) => {
          this.propertyMap[prop._id || ''] = prop.name;
        });
        this.propertyOptionsLoaded = true;
      },
      error: () => {
        // Silent fail - just continue without property names
        this.propertyOptionsLoaded = true;
      },
    });
  }

  getPropertyName(propertyId: string): string {
    return this.propertyMap[propertyId] || 'Unknown Property';
  }

  getUnitTypeLabel(type: string | undefined): string {
    if (!type) return '-';
    return type
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  getFloorLabel(floor: number | string | undefined): string {
    if (floor === undefined || floor === null) return '-';
    if (floor === 'G' || floor === 0) return 'G';
    const floorNum = typeof floor === 'string' ? parseInt(floor) : floor;
    if (isNaN(floorNum)) return String(floor);
    // Add ordinal suffix
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = floorNum % 100;
    return floorNum + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  updateFloorOptions(): void {
    // Extract unique floor values from loaded units
    const floors = this.units
      .map(u => u.floor)
      .filter((f): f is string | number => f !== undefined && f !== null);
    const uniqueFloors = Array.from(new Set(floors));
    
    // Sort floors: G/0 first, then numerically
    this.floorOptions = uniqueFloors.sort((a, b) => {
      const aIsGround = a === 'G' || a === 0;
      const bIsGround = b === 'G' || b === 0;
      if (aIsGround && !bIsGround) return -1;
      if (!aIsGround && bIsGround) return 1;
      if (aIsGround && bIsGround) return 0;
      const aNum = typeof a === 'string' ? parseInt(a, 10) : a;
      const bNum = typeof b === 'string' ? parseInt(b, 10) : b;
      return aNum - bNum;
    });
  }

    calculateStats(): void {
    const propertyIdToSend = this.urlPropertyId || this.propertyIdFilter || undefined;
    this.unitsService.getStats(propertyIdToSend).subscribe({
      next: (s) => {
        if (s) {
          this.totalUnits = s.total ?? this.total;
          this.occupiedUnits = s.occupied ?? 0;
          this.vacantUnits = s.vacant ?? s.available ?? 0;
          this.maintenanceUnits = s.maintenance ?? 0;
        }
      },
      error: () => {
        this.totalUnits = this.total;
        this.occupiedUnits = this.units.filter(u => u.status === 'occupied').length;
        this.vacantUnits = this.units.filter(u => u.status === 'vacant').length;
        this.maintenanceUnits = this.units.filter(u => u.status === 'maintenance').length;
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadUnits();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadUnits();
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadUnits();
  }

  openCreateModal(): void {
    this.selectedUnit = null;
    this.formModalOpen = true;
  }

  openEditModal(unit: Unit): void {
    this.selectedUnit = unit;
    this.formModalOpen = true;
  }

  closeFormModal(): void {
    this.formModalOpen = false;
    this.selectedUnit = null;
  }

  onUnitSaved(unit: Unit): void {
    this.loadUnits();
    this.closeFormModal();
  }

  openViewModal(unit: Unit): void {
    this.selectedUnit = unit;
    this.viewModalOpen = true;
  }

  closeViewModal(): void {
    this.viewModalOpen = false;
    this.selectedUnit = null;
  }

  onUnitEdit(unit: Unit): void {
    this.closeViewModal();
    this.openEditModal(unit);
  }

  viewUnit(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/units', id]);
    }
  }

  deleteUnit(id: string | undefined): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this unit?')) {
      this.unitsService.delete(id).subscribe({
        next: () => {
          this.loadUnits();
        },
        error: (err) => {
          console.error('Delete error:', err);
        },
      });
    }
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      vacant: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      occupied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      reserved: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }

  openImportModal(): void {
    this.importModalOpen = true;
    this.importError = '';
    this.importSuccessMessage = '';
    this.parsedImportRows = [];
    this.importFileName = '';
    this.importRawText = '';
  }

  closeImportModal(): void {
    this.importModalOpen = false;
    this.isImporting = false;
    this.importError = '';
    this.importSuccessMessage = '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDropFile(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  processFile(file: File): void {
    this.importFileName = file.name;
    this.importError = '';
    this.importSuccessMessage = '';

    const lowerName = file.name.toLowerCase();
    const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            this.importError = 'No sheets found in Excel file.';
            return;
          }
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const csvText = XLSX.utils.sheet_to_csv(firstSheet);
          this.importRawText = csvText;
          this.parseCsv(csvText);
        } catch (err: any) {
          console.error('Error parsing Excel file:', err);
          this.importError = 'Failed to parse Excel file: ' + (err?.message || 'Invalid format');
        }
      };
      reader.onerror = () => {
        this.importError = 'Failed to read file.';
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        this.importRawText = text;
        this.parseCsv(text);
      };
      reader.onerror = () => {
        this.importError = 'Failed to read file.';
      };
      reader.readAsText(file);
    }
  }

  onPasteTextChange(): void {
    this.importError = '';
    this.importSuccessMessage = '';
    this.parseCsv(this.importRawText);
  }

  parseCsv(raw: string): void {
    if (!raw || !raw.trim()) {
      this.parsedImportRows = [];
      return;
    }
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      this.parsedImportRows = [];
      return;
    }

    const headerLine = lines[0];
    const headers = this.parseCsvLine(headerLine).map(h => h.trim().toLowerCase());
    
    let propIdx = headers.findIndex(h => h.includes('property') || h.includes('building') || h.includes('estate'));
    let unitIdx = headers.findIndex(h => h.includes('unit') || h.includes('house') || h.includes('room') || h.includes('door') || h.includes('number'));
    let rentIdx = headers.findIndex(h => h.includes('rent') || h.includes('amount') || h.includes('kes') || h.includes('price') || h.includes('monthly'));

    if (propIdx === -1 && headers.length > 0) propIdx = 0;
    if (unitIdx === -1 && headers.length > 1) unitIdx = 1;
    if (rentIdx === -1 && headers.length > 2) rentIdx = 2;

    const rows: { property: string; unitNumber: string; rentAmount: number }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      const rawProp = (cols[propIdx] || '').trim();
      const rawUnit = (cols[unitIdx] || '').trim();
      const rawRent = (cols[rentIdx] || '').trim();

      if (!rawUnit && !rawProp) continue;

      const lowerUnit = rawUnit.toLowerCase();
      const lowerProp = rawProp.toLowerCase();
      if (lowerUnit === 'total' || lowerProp === 'total' || lowerUnit.startsWith('total ') || lowerProp.startsWith('total ')) {
        continue;
      }

      const rentNum = parseFloat(rawRent.replace(/[^0-9.-]+/g, '')) || 0;
      rows.push({
        property: rawProp,
        unit: rawUnit,
        unitNumber: rawUnit,
        rentAmount: rentNum,
      } as any);
    }

    this.parsedImportRows = rows;
  }

  parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === '\t') && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  submitImport(): void {
    if (this.parsedImportRows.length === 0 && !this.importRawText.trim()) {
      this.importError = 'No valid rows found to import. Please check your file or pasted text.';
      return;
    }
    this.isImporting = true;
    this.importError = '';
    this.importSuccessMessage = '';

    const mappedUnits = this.parsedImportRows.map((r: any) => ({
      property: r.property,
      unit: r.unit || r.unitNumber,
      unitNumber: r.unit || r.unitNumber,
      rentAmount: r.rentAmount,
    }));

    this.unitsService.bulkImport({
      csvText: this.importRawText,
      units: mappedUnits,
    }).subscribe({
      next: (res: any) => {
        this.isImporting = false;
        const created = res.created ?? res.createdUnits ?? 0;
        const updated = res.updated ?? res.updatedUnits ?? 0;
        const props = (res.propertiesAffected && res.propertiesAffected.length) || res.createdProperties || 0;
        this.importSuccessMessage = `Successfully processed: ${created} created, ${updated} updated (${props} property/properties).`;
        this.loadUnits();
        this.loadPropertyOptions();
        setTimeout(() => {
          this.closeImportModal();
        }, 1800);
      },
      error: (err: any) => {
        this.isImporting = false;
        this.importError = err?.error?.message || err?.message || 'Failed to import units.';
      }
    });
  }

  downloadSampleCsv(): void {
    const csvContent = 'Property,Unit,Monthly Rent (KES)\n' +
      'Tosi Shopping Mall Apartments,House S1,6500\n' +
      'Tosi Shopping Mall Apartments,House S2,7000\n' +
      'Tosi Shopping Mall Apartments,House S3,8000\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'units_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  get pagesList(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.page - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  get minShowing(): number {
    if (this.total === 0) return 0;
    return (this.page - 1) * this.limit + 1;
  }

  get maxShowing(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  onLimitChange(): void {
    this.page = 1;
    this.loadUnits();
  }

}