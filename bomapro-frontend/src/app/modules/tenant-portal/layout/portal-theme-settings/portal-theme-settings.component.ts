import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { PortalThemeService } from '../../shared/services/portal-theme.service';

const PRESETS = [
  { name: 'Emerald',   hex: '#059669' },
  { name: 'Sky',       hex: '#0284c7' },
  { name: 'Violet',    hex: '#7c3aed' },
  { name: 'Rose',      hex: '#e11d48' },
  { name: 'Amber',     hex: '#d97706' },
  { name: 'Cyan',      hex: '#0891b2' },
  { name: 'Pink',      hex: '#db2777' },
  { name: 'Slate',     hex: '#475569' },
];

@Component({
  selector: 'app-portal-theme-settings',
  templateUrl: './portal-theme-settings.component.html',
})
export class PortalThemeSettingsComponent implements OnInit {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  presets = PRESETS;
  hue = 160;

  constructor(public theme: PortalThemeService) {}

  ngOnInit() {
    this.hue = this.theme.getHue();
    this.theme.accentHex$.subscribe(() => {
      this.hue = this.theme.getHue();
    });
  }

  get accentHex() { return this.theme.accentHex; }
  get isDark() { return this.theme.isDark; }

  toggleDark() {
    this.theme.toggleDark();
  }

  onHueChange(event: Event) {
    this.hue = +(event.target as HTMLInputElement).value;
    const hex = this.theme.hexFromHue(this.hue);
    this.theme.setAccentColor(hex);
  }

  onColorInput(event: Event) {
    const hex = (event.target as HTMLInputElement).value;
    this.theme.setAccentColor(hex);
  }

  applyPreset(hex: string) {
    this.theme.setAccentColor(hex);
  }

  close(event: MouseEvent) {
    if ((event.target as HTMLElement) === event.currentTarget) {
      this.closed.emit();
    }
  }

  closePanel() {
    this.closed.emit();
  }
}
