import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'skillswap_theme';
  readonly theme = signal<Theme>(this.getStoredTheme());

  constructor() {
    // Apply theme immediately on construction (synchronous, before first paint)
    this.applyTheme(this.theme());

    // React to future theme changes
    effect(() => {
      const current = this.theme();
      this.applyTheme(current);
      localStorage.setItem(this.storageKey, current);
    });

    // Enable CSS transitions AFTER the first frame to prevent FOUC on load
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('theme-ready');
      });
    });
  }

  toggleTheme(): void {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  private getStoredTheme(): Theme {
    const stored = localStorage.getItem(this.storageKey) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
