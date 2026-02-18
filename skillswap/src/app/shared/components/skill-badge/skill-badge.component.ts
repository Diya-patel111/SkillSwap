import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skill-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClass">
      @if (icon) {
        <span class="material-symbols-outlined text-sm">{{ icon }}</span>
      }
      {{ label }}
    </span>
  `,
})
export class SkillBadgeComponent {
  @Input() label = '';
  @Input() icon?: string;
  @Input() variant: 'primary' | 'secondary' | 'pill' = 'primary';

  get badgeClass(): string {
    const base = 'inline-flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1';
    const variants = {
      primary: 'bg-primary/10 text-primary',
      secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      pill: 'bg-primary text-white shadow-sm',
    };
    return `${base} ${variants[this.variant]}`;
  }
}
