import {
  Component, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService, Toast, ToastVariant } from '../../../core/services/toast.service';

const variantConfig: Record<ToastVariant, { icon: string; classes: string }> = {
  success: {
    icon: 'check_circle',
    classes: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-300',
  },
  error: {
    icon: 'error',
    classes: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300',
  },
  warning: {
    icon: 'warning',
    classes: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-300',
  },
  info: {
    icon: 'info',
    classes: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300',
  },
};

/**
 * Global toast container — fixed to top-right.
 * Mounts once in AppComponent.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  animations: [
    trigger('toast', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('220ms cubic-bezier(0.22,1,0.36,1)',
          style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('180ms ease-in',
          style({ opacity: 0, transform: 'translateX(110%)' })),
      ]),
    ]),
  ],
  template: `
    <div
      class="fixed top-4 right-4 z-[9998] flex flex-col gap-2 w-80 pointer-events-none"
      aria-live="polite"
      aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          [@toast]
          [class]="cfg(toast.variant).classes"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border
                 shadow-lg shadow-black/5 text-sm font-medium">
          <!-- Icon -->
          <span class="material-symbols-outlined text-[20px] shrink-0 mt-0.5"
                style="font-variation-settings: 'FILL' 1">
            {{ cfg(toast.variant).icon }}
          </span>
          <!-- Message -->
          <span class="flex-1 leading-snug">{{ toast.message }}</span>
          <!-- Close -->
          <button
            type="button"
            (click)="toastService.dismiss(toast.id)"
            class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  cfg(variant: ToastVariant) {
    return variantConfig[variant];
  }
}
