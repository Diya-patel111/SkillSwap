import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="toggle()"
      [attr.aria-label]="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      [title]="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      class="relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full
             border-2 border-transparent transition-colors duration-200 focus:outline-none
             focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      [class.bg-primary]="isDark"
      [class.bg-slate-200]="!isDark"
      [class.dark:bg-slate-700]="!isDark">
      <!-- Sliding knob -->
      <span
        class="pointer-events-none inline-flex h-5 w-5 transform items-center justify-center
               rounded-full bg-white shadow-md ring-0 transition-transform duration-200"
        [class.translate-x-7]="isDark"
        [class.translate-x-0]="!isDark">
        <!-- Icon inside knob -->
        <span class="material-symbols-outlined text-[14px] leading-none"
              [class.text-primary]="isDark"
              [class.text-slate-400]="!isDark">
          {{ isDark ? 'dark_mode' : 'light_mode' }}
        </span>
      </span>
    </button>
  `,
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  get isDark(): boolean { return this.themeService.isDark(); }

  toggle(): void { this.themeService.toggleTheme(); }
}
