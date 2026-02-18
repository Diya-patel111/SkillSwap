import { Injectable, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';

/**
 * Single source of truth for the authenticated user's state.
 *
 * All components/services that need user info should inject THIS service
 * (not AuthService directly) so they react to signal/observable changes
 * without re-fetching or polling.
 */
@Injectable({ providedIn: 'root' })
export class UserStateService {
  // ── Core reactive state ────────────────────────────────────────────────
  private readonly _user = new BehaviorSubject<User | null>(null);

  /** Observable stream — use in templates via `async` pipe or subscribe(). */
  readonly currentUser$ = this._user.asObservable();

  /**
   * Signal-based current user.
   * `toSignal` bridges the BehaviorSubject to Angular's signal system so that
   * `computed()` derivatives below update automatically on every `next()` call.
   */
  readonly currentUser = toSignal(this._user.asObservable(), { initialValue: null as User | null });

  // ── Computed signals (use in templates directly — no async pipe needed) ─

  /** True when a user is logged in. */
  readonly isLoggedIn = computed(() => !!this.currentUser());

  /** First name for greeting messages ("Welcome back, Alex!"). */
  readonly userName = computed(() => {
    const name = this.currentUser()?.name;
    return name ? name.split(' ')[0] : 'there';
  });

  /** Full display name. */
  readonly fullName = computed(() => this.currentUser()?.name ?? '');

  /** Avatar URL, or null to fall back to initials. */
  readonly userAvatar = computed(() => this.currentUser()?.avatar || null);

  /** 1-2 uppercase initials derived from the user's name. */
  readonly userInitials = computed(() => {
    const name = this.currentUser()?.name;
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join('');
  });

  /** User's major or 'Student' as a fallback label. */
  readonly userRole = computed(() => this.currentUser()?.major || 'Student');

  // ── Mutators ───────────────────────────────────────────────────────────

  /** Replace the entire user object (login / session restore). */
  set(user: User): void {
    this._user.next(user);
  }

  /** Wipe user state (logout). */
  clear(): void {
    this._user.next(null);
  }

  /**
   * Merge a partial update into the current user without a full replacement.
   * Useful after profile edits or avatar uploads.
   */
  update(partial: Partial<User>): void {
    const current = this._user.getValue();
    if (current) {
      this._user.next({ ...current, ...partial });
    }
  }

  /** Synchronous snapshot — for code that can't use async/reactive patterns. */
  snapshot(): User | null {
    return this._user.getValue();
  }
}

