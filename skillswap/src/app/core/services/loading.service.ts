import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  /** Number of in-flight HTTP requests. */
  private readonly _count = signal(0);

  /** True whenever at least one request is active. */
  readonly isLoading = computed(() => this._count() > 0);

  /** Current count — used by the progress bar for width interpolation. */
  readonly count = this._count.asReadonly();

  increment(): void {
    this._count.update(n => n + 1);
  }

  decrement(): void {
    this._count.update(n => Math.max(0, n - 1));
  }

  /** Force-reset (e.g. on navigation or unrecoverable error). */
  reset(): void {
    this._count.set(0);
  }
}
