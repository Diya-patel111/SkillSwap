import {
  Component, input, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant =
  | 'text'        // Single line of text
  | 'text-sm'     // Smaller text line
  | 'title'       // Heading-size block
  | 'avatar'      // Circle avatar
  | 'avatar-sm'   // Smaller circle
  | 'button'      // Rounded pill button
  | 'card'        // Tall card block
  | 'stat'        // Stat number block (large)
  | 'badge';      // Small pill badge

const variantClasses: Record<SkeletonVariant, string> = {
  'text':     'h-4 w-full rounded-md',
  'text-sm':  'h-3 w-3/4 rounded-md',
  'title':    'h-7 w-48 rounded-lg',
  'avatar':   'h-12 w-12 rounded-full',
  'avatar-sm':'h-8 w-8 rounded-full',
  'button':   'h-9 w-28 rounded-xl',
  'card':     'h-24 w-full rounded-2xl',
  'stat':     'h-9 w-16 rounded-lg',
  'badge':    'h-5 w-16 rounded-full',
};

/**
 * Reusable skeleton loader — renders an animated pulse placeholder.
 *
 * Usage:
 *   <app-skeleton variant="text" />
 *   <app-skeleton variant="card" [count]="3" />
 *   <app-skeleton variant="avatar" class="mb-2" />
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @for (i of items(); track i) {
      <div
        [class]="shapeClass()"
        class="animate-pulse bg-slate-200 dark:bg-slate-700/60">
      </div>
    }
  `,
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('text');
  /** How many skeleton items to render. */
  readonly count   = input<number>(1);

  items(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }

  shapeClass(): string {
    return variantClasses[this.variant()];
  }
}
