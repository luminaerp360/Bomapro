import { Injectable, RendererFactory2, Renderer2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PortalThemeService {
  private renderer: Renderer2;

  isDark$ = new BehaviorSubject<boolean>(false);
  accentHex$ = new BehaviorSubject<string>('#059669');

  get isDark() { return this.isDark$.value; }
  get accentHex() { return this.accentHex$.value; }

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.load();
  }

  toggleDark() {
    this.setDark(!this.isDark);
  }

  setDark(dark: boolean) {
    this.isDark$.next(dark);
    if (dark) {
      this.renderer.addClass(document.documentElement, 'dark');
    } else {
      this.renderer.removeClass(document.documentElement, 'dark');
    }
    this.save();
  }

  setAccentColor(hex: string) {
    this.accentHex$.next(hex);
    const palette = this.generatePalette(hex);
    const root = document.documentElement;
    Object.entries(palette).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
    this.save();
  }

  /** Extract hue (0-359) from current accent hex */
  getHue(): number {
    return this.hexToHsl(this.accentHex)[0];
  }

  /** Build a new accent hex from a hue, keeping original S/L */
  hexFromHue(hue: number): string {
    const [, s, l] = this.hexToHsl(this.accentHex);
    return this.hslToHex(hue, s, l);
  }

  // ── Palette generation ────────────────────────────────────────────────────
  private generatePalette(hex: string): Record<string, string> {
    const [h, s, l] = this.hexToHsl(hex);
    return {
      '--accent-50':  this.hslToHex(h, Math.round(s * 0.25), 97),
      '--accent-100': this.hslToHex(h, Math.round(s * 0.40), 93),
      '--accent-200': this.hslToHex(h, Math.round(s * 0.58), 84),
      '--accent-300': this.hslToHex(h, Math.round(s * 0.72), 73),
      '--accent-400': this.hslToHex(h, Math.round(s * 0.86), 62),
      '--accent-500': this.hslToHex(h, s, Math.min(l + 9, 96)),
      '--accent-600': hex,
      '--accent-700': this.hslToHex(h, Math.min(s + 4, 100), Math.max(l - 8, 5)),
      '--accent-800': this.hslToHex(h, Math.min(s + 5, 100), Math.max(l - 17, 3)),
      '--accent-900': this.hslToHex(h, Math.min(s + 6, 100), Math.max(l - 25, 2)),
    };
  }

  // ── Color math ────────────────────────────────────────────────────────────
  private hexToHsl(hex: string): [number, number, number] {
    if (!hex || hex.length < 7) return [160, 84, 30];
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  private hslToHex(h: number, s: number, l: number): string {
    const sl = s / 100;
    const ll = l / 100;
    const a = sl * Math.min(ll, 1 - ll);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * Math.max(0, Math.min(1, color)))
        .toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  // ── Persistence ───────────────────────────────────────────────────────────
  private save() {
    try {
      localStorage.setItem('portal_dark', String(this.isDark));
      localStorage.setItem('portal_accent', this.accentHex);
    } catch {}
  }

  private load() {
    try {
      const dark = localStorage.getItem('portal_dark') === 'true';
      const hex = localStorage.getItem('portal_accent') || '#059669';
      this.setDark(dark);
      this.setAccentColor(hex);
    } catch {
      this.setDark(false);
      this.setAccentColor('#059669');
    }
  }
}
