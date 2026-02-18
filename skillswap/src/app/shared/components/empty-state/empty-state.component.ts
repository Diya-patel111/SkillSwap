import {
  Component, input, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type EmptyStateVariant =
  | 'no-results'
  | 'no-swaps'
  | 'no-reviews'
  | 'no-skills'
  | 'no-messages'
  | 'error'
  | 'offline';

interface EmptyConfig {
  svg: string;
  defaultTitle: string;
  defaultBody: string;
}

const configs: Record<EmptyStateVariant, EmptyConfig> = {
  'no-results': {
    defaultTitle: 'No results found',
    defaultBody:  'Try adjusting your search or filters.',
    svg: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="88" cy="76" r="48" stroke="currentColor" stroke-width="6" stroke-linecap="round" class="text-slate-200 dark:text-slate-700"/>
      <path d="M124 112 L152 140" stroke="currentColor" stroke-width="7" stroke-linecap="round" class="text-slate-300 dark:text-slate-600"/>
      <path d="M72 63 Q88 48 104 63" stroke="currentColor" stroke-width="4" stroke-linecap="round" class="text-slate-300 dark:text-slate-600" fill="none"/>
      <circle cx="78" cy="75" r="4" fill="currentColor" class="text-slate-300 dark:text-slate-600"/>
      <circle cx="98" cy="75" r="4" fill="currentColor" class="text-slate-300 dark:text-slate-600"/>
    </svg>`,
  },
  'no-swaps': {
    defaultTitle: 'No swap requests yet',
    defaultBody:  'Browse students to propose your first skill trade.',
    svg: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="56" width="56" height="56" rx="12" stroke="currentColor" stroke-width="5" class="text-slate-200 dark:text-slate-700"/>
      <rect x="104" y="56" width="56" height="56" rx="12" stroke="currentColor" stroke-width="5" class="text-slate-200 dark:text-slate-700"/>
      <path d="M96 84 L104 84" stroke="currentColor" stroke-width="5" stroke-linecap="round" class="text-primary/60"/>
      <path d="M92 80 L96 84 L92 88" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="text-primary/60"/>
      <path d="M108 80 L104 84 L108 88" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="text-primary/60"/>
    </svg>`,
  },
  'no-reviews': {
    defaultTitle: 'No reviews yet',
    defaultBody:  'Complete a swap to receive your first rating.',
    svg: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 44 L110 74 H142 L118 92 L128 122 L100 104 L72 122 L82 92 L58 74 H90 Z"
            stroke="currentColor" stroke-width="5" stroke-linejoin="round" class="text-slate-200 dark:text-slate-700"/>
    </svg>`,
  },
  'no-skills': {
    defaultTitle: 'No skills listed',
    defaultBody:  'Add skills you can teach or want to learn.',
    svg: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 110 C60 88 80 70 100 70 C120 70 140 88 140 110" stroke="currentColor" stroke-width="5" stroke-linecap="round" class="text-slate-200 dark:text-slate-700"/>
      <circle cx="100" cy="54" r="16" stroke="currentColor" stroke-width="5" class="text-slate-200 dark:text-slate-700"/>
      <path d="M86 110 L86 96 C86 90 114 90 114 96 L114 110" stroke="currentColor" stroke-width="4" class="text-primary/50 dark:text-primary/40" fill="none"/>
    </svg>`,
  },
  'no-messages': {
    defaultTitle: 'No messages yet',
    defaultBody:  'Start a conversation with a skill partner.',
    svg: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="36" y="44" width="128" height="80" rx="16" stroke="currentColor" stroke-width="5" class="text-slate-200 dark:text-slate-700"/>
      <path d="M64 124 L72 108" stroke="currentColor" stroke-width="5" stroke-linecap="round" class="text-slate-200 dark:text-slate-700"/>
      <path d="M72 76 H128" stroke="currentColor" stroke-width="4" stroke-linecap="round" class="text-slate-300 dark:text-slate-600"/>
      <path d="M72 92 H108" stroke="currentColor" stroke-width="4" stroke-linecap="round" class="text-slate-300 dark:text-slate-600"/>
    </svg>`,
  },
  'error': {
    defaultTitle: 'Something went wrong',
    defaultBody:  'Please try refreshing the page.',
    svg: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="48" stroke="currentColor" stroke-width="5" class="text-red-200 dark:text-red-900/60"/>
      <path d="M100 56 L100 86" stroke="currentColor" stroke-width="6" stroke-linecap="round" class="text-red-400 dark:text-red-500"/>
      <circle cx="100" cy="100" r="4" fill="currentColor" class="text-red-400 dark:text-red-500"/>
    </svg>`,
  },
  'offline': {
    defaultTitle: 'You\'re offline',
    defaultBody:  'Check your internet connection and try again.',
    svg: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 76 Q100 36 156 76" stroke="currentColor" stroke-width="5" stroke-linecap="round" class="text-slate-200 dark:text-slate-700"/>
      <path d="M60 92 Q100 64 140 92" stroke="currentColor" stroke-width="5" stroke-linecap="round" class="text-slate-200 dark:text-slate-700"/>
      <path d="M76 108 Q100 92 124 108" stroke="currentColor" stroke-width="5" stroke-linecap="round" class="text-slate-200 dark:text-slate-700"/>
      <circle cx="100" cy="122" r="6" fill="currentColor" class="text-slate-300 dark:text-slate-600"/>
      <path d="M40 40 L160 130" stroke="currentColor" stroke-width="4" stroke-linecap="round" class="text-red-300 dark:text-red-600"/>
    </svg>`,
  },
};

/**
 * Empty state component with inline SVG illustration, heading, body copy
 * and an optional CTA button or router link.
 *
 * Usage:
 *   <app-empty-state variant="no-swaps" ctaLabel="Browse Students" ctaRoute="/skills" />
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center text-center py-16 px-6 select-none">
      <!-- Illustration -->
      <div class="w-40 h-32 mb-6 opacity-90" [innerHTML]="cfg().svg"></div>

      <!-- Heading -->
      <h3 class="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
        {{ title() || cfg().defaultTitle }}
      </h3>

      <!-- Body -->
      <p class="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
        {{ body() || cfg().defaultBody }}
      </p>

      <!-- CTA -->
      @if (ctaLabel() && ctaRoute()) {
        <a
          [routerLink]="ctaRoute()"
          class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white
                 text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
          @if (ctaIcon()) {
            <span class="material-symbols-outlined text-[18px]">{{ ctaIcon() }}</span>
          }
          {{ ctaLabel() }}
        </a>
      }
      @if (ctaLabel() && !ctaRoute() && ctaClick()) {
        <button
          type="button"
          (click)="ctaClick()!()"
          class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white
                 text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
          @if (ctaIcon()) {
            <span class="material-symbols-outlined text-[18px]">{{ ctaIcon() }}</span>
          }
          {{ ctaLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly variant  = input<EmptyStateVariant>('no-results');
  readonly title    = input<string>('');
  readonly body     = input<string>('');
  readonly ctaLabel = input<string>('');
  readonly ctaRoute = input<string>('');
  readonly ctaIcon  = input<string>('');
  readonly ctaClick = input<(() => void) | null>(null);

  cfg() { return configs[this.variant()]; }
}
