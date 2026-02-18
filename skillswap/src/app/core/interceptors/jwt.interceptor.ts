import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  throwError,
  filter,
  take,
  switchMap,
  catchError,
} from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Shared refresh-lock state (module-level, effectively a singleton).
 *
 * isRefreshing$ — true while a token refresh call is in-flight.
 * refreshToken$  — emits the new token once refresh completes;
 *                  queued requests switch to it and retry.
 *
 * Using module-level variables here is the standard Angular functional-
 * interceptor pattern for shared mutable interceptor state.
 */
let isRefreshing = false;
const refreshToken$ = new BehaviorSubject<string | null>(null);

/** Attach the current access token to an outgoing request */
function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Handle a 401 response:
 *  - If a refresh is already in-flight, queue the request until the new
 *    token is emitted, then retry.
 *  - Otherwise start a refresh, emit the new token, retry, then unlock.
 */
function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<any> {
  if (!authService.getRefreshToken()) {
    authService.logout();
    return throwError(() => ({ status: 401, message: 'Session expired. Please log in again.' }));
  }

  if (isRefreshing) {
    // Wait for the ongoing refresh to emit a token, then retry
    return refreshToken$.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap(token => next(addToken(req, token)))
    );
  }

  // Start the refresh
  isRefreshing = true;
  refreshToken$.next(null);

  return authService.refreshToken().pipe(
    switchMap(res => {
      isRefreshing = false;
      refreshToken$.next(res.token);
      return next(addToken(req, res.token));
    }),
    catchError(err => {
      isRefreshing = false;
      authService.logout();
      return throwError(() => ({
        status: 401,
        message: 'Session expired. Please log in again.',
        original: err,
      }));
    })
  );
}

/**
 * JwtInterceptor — functional HttpInterceptorFn.
 *
 * 1. Attaches Bearer token to every outgoing request (skips if no token).
 * 2. On 401: attempts silent token refresh with concurrent-request locking.
 * 3. On refresh failure: calls logout() and redirects to /auth/login.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Skip auth header for public endpoints (login / register / refresh)
  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh');

  const authReq = token && !isAuthEndpoint ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        return handle401(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};
