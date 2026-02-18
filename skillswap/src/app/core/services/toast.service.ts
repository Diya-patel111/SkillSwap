import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  /** Duration in ms before auto-dismiss. 0 = persist until manual close. */
  duration: number;
}

let _id = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string, duration = 4000): void {
    this._add(message, 'success', duration);
  }

  error(message: string, duration = 6000): void {
    this._add(message, 'error', duration);
  }

  info(message: string, duration = 4000): void {
    this._add(message, 'info', duration);
  }

  warning(message: string, duration = 5000): void {
    this._add(message, 'warning', duration);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private _add(message: string, variant: ToastVariant, duration: number): void {
    const toast: Toast = { id: ++_id, message, variant, duration };
    this.toasts.update(list => [...list, toast]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast.id), duration);
    }
  }
}
