import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { ApiService } from './api.service';
import { UserStateService } from './user-state.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api    = inject(ApiService);
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly userState = inject(UserStateService);

  // ── Convenience re-exports so existing consumers keep working ──────────
  /** Stream of the current user — delegates to UserStateService. */
  readonly currentUser$ = this.userState.currentUser$;

  /** True when a user is authenticated — delegates to UserStateService. */
  readonly isLoggedIn = this.userState.isLoggedIn;

  // ── Auth flows ─────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<AuthUser> {
    return this.api.post<AuthUser>('/auth/login', credentials).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(err => throwError(() => err))
    );
  }

  register(payload: RegisterRequest): Observable<AuthUser> {
    return this.api.post<AuthUser>('/auth/register', payload).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Full logout: wipes tokens + persisted user, clears reactive state,
   * then navigates to the login screen.
   */
  logout(): void {
    localStorage.removeItem(environment.jwtTokenKey);
    localStorage.removeItem(environment.jwtRefreshKey);
    localStorage.removeItem(environment.userKey);
    this.userState.clear();
    this.router.navigate(['/auth/login']);
  }

  // ── Token helpers ──────────────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(environment.jwtTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(environment.jwtRefreshKey);
  }

  /** True when a non-expired JWT is present in localStorage. */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /** Synchronous snapshot of the current user (prefer signals/streams when possible). */
  getCurrentUser(): User | null {
    return this.userState.snapshot();
  }

  // ── Token refresh ──────────────────────────────────────────────────────

  refreshToken(): Observable<{ token: string }> {
    return this.api.post<{ token: string }>('/auth/refresh', {
      refreshToken: this.getRefreshToken(),
    }).pipe(
      tap(res => localStorage.setItem(environment.jwtTokenKey, res.token)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  // ── Session restore (called once on app boot via APP_INITIALIZER) ──────

  /**
   * 1. Immediately hydrates user state from localStorage (instant UI).
   * 2. Calls /auth/me in the background to re-validate and refresh the
   *    stored user profile.  Silently logs out on 401.
   */
  restoreSession(): Observable<User | null> {
    // Step 1 — instant hydration from localStorage
    const storedUser = this.getUserFromStorage();
    if (storedUser) {
      this.userState.set(storedUser);
    }

    // Step 2 — background re-validation (token may have expired, etc.)
    if (!this.isAuthenticated()) {
      // No valid token → nothing to restore
      if (storedUser) this.logout(); // token expired — clean up silently
      return of(null);
    }

    return this.http.get<User>(`${environment.apiUrl}/auth/me`, {
        headers: new HttpHeaders({ 'X-Silent': '1' }),
      }).pipe(
      tap(user => {
        this.userState.set(user);
        // Refresh the persisted cache with the latest server data
        localStorage.setItem(environment.userKey, JSON.stringify(user));
      }),
      map(user => user),
      catchError((err: HttpErrorResponse) => {
        // Only force-logout on a definitive 401 (bad / expired token).
        // Network errors (status 0) or 5xx mean the API is temporarily
        // unreachable — keep the cached session so the user stays logged in.
        if (err?.status === 401) {
          this.logout();
        }
        return of(null);
      })
    );
  }

  // ── Google OAuth helpers ───────────────────────────────────────────────

  /**
   * Called by AuthCallbackComponent after Google's redirect.
   * Stores the tokens then fetches the full user via /auth/me.
   */
  handleOAuthCallback(token: string, refreshToken: string): Observable<User | null> {
    localStorage.setItem(environment.jwtTokenKey, token);
    localStorage.setItem(environment.jwtRefreshKey, refreshToken);

    return this.http.get<User>(`${environment.apiUrl}/auth/me`, {
        headers: new HttpHeaders({ 'X-Silent': '1' }),
      }).pipe(
      tap(user => {
        this.userState.set(user);
        localStorage.setItem(environment.userKey, JSON.stringify(user));
      }),
      catchError((err: HttpErrorResponse) => {
        // On a genuine 401 the tokens were rejected — clear them.
        // On a network error keep the tokens so the user can retry.
        if (err?.status === 401) {
          this.logout();
        }
        return of(null);
      })
    );
  }

  /** Redirect the browser to the backend Google OAuth entry-point. */
  initiateGoogleLogin(): void {
    window.location.href = environment.googleAuthUrl;
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private handleAuthSuccess(res: AuthUser): void {
    localStorage.setItem(environment.jwtTokenKey, res.token);
    localStorage.setItem(environment.jwtRefreshKey, res.refreshToken);
    // Persist the full user so restoreSession() can hydrate instantly on reload
    localStorage.setItem(environment.userKey, JSON.stringify(res.user));
    this.userState.set(res.user);
  }

  /**
   * Reads the user profile JSON that was saved in localStorage during
   * handleAuthSuccess.  No JWT decoding magic needed.
   */
  private getUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(environment.userKey);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  /**
   * Returns true if the JWT's `exp` claim is in the past.
   * Gives a 30 s buffer to avoid race conditions.
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = (payload.exp as number) * 1000;
      return Date.now() >= expiresAt - 30_000; // 30 s buffer
    } catch {
      return true; // malformed token → treat as expired
    }
  }
}
