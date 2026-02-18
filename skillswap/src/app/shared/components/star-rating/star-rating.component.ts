import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type StarSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-0.5" [attr.aria-label]="'Rating: ' + value() + ' out of ' + max()">

      @if (interactive()) {
        <!-- ── Interactive mode ────────────────────────────────────── -->
        @for (star of starRange(); track star) {
          <button
            type="button"
            (mouseenter)="hovered.set(star)"
            (mouseleave)="hovered.set(0)"
            (click)="select(star)"
            class="material-symbols-outlined transition-all hover:scale-110 active:scale-95"
            [class]="interactiveStarClass(star)"
            [attr.aria-label]="'Rate ' + star + ' star' + (star > 1 ? 's' : '')">star</button>
        }
      } @else {
        <!-- ── Display mode ────────────────────────────────────────── -->
        @for (star of displayStars(); track $index) {
          <span class="material-symbols-outlined" [class]="displayStarClass(star)">
            {{ star === 'half' ? 'star_half' : 'star' }}
          </span>
        }
      }

    </div>
  `,
})
export class StarRatingComponent {
  /** Current rating value (supports decimals for display mode). */
  readonly value       = input<number>(0);
  /** Number of stars. */
  readonly max         = input<number>(5);
  /** Enable click-to-rate. */
  readonly interactive = input<boolean>(false);
  /** Icon size. */
  readonly size        = input<StarSize>('md');

  /** Emits the selected star value when interactive. */
  readonly valueChange = output<number>();

  /** Hover state (interactive only). */
  readonly hovered = signal(0);

  readonly starRange = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));

  readonly displayStars = computed(() => {
    const v = this.value();
    return Array.from({ length: this.max() }, (_, i) => {
      const pos = i + 1;
      if (v >= pos)       return 'full' as const;
      if (v >= pos - 0.5) return 'half' as const;
      return 'empty' as const;
    });
  });

  readonly sizeClass = computed((): string => {
    const map: Record<StarSize, string> = {
      xs: 'text-[14px]',
      sm: 'text-[18px]',
      md: 'text-[24px]',
      lg: 'text-[32px]',
    };
    return map[this.size()];
  });

  interactiveStarClass(star: number): string {
    const filled = (this.hovered() || this.value()) >= star;
    return `${this.sizeClass()} ${filled ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`;
  }

  displayStarClass(type: 'full' | 'half' | 'empty'): string {
    const colour = type === 'empty' ? 'text-slate-200 dark:text-slate-700' : 'text-amber-400';
    return `${this.sizeClass()} ${colour}`;
  }

  select(star: number): void {
    if (!this.interactive()) return;
    this.valueChange.emit(star);
  }
}
