import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';

/**
 * ErrorInterceptor — global HTTP error handler.
 *
 * Responsibilities (separate from JwtInterceptor):
 *  - 0 / network error  → user-friendly offline message
 *  - 403 Forbidden       → redirect to /dashboard (not /login)
 *  - 404 Not Found       → pass through (let services decide)
 *  - 500+               → log and pass through normalized error
 *
 * 401 handling (token refresh + logout) lives in jwt.interceptor.ts.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast  = inject(ToastService);

  // Requests with X-Silent header suppress toast notifications.
  // Strip the header before forwarding so the backend never sees it.
  const silent = req.headers.has('X-Silent');
  const cleanReq = silent ? req.clone({ headers: req.headers.delete('X-Silent') }) : req;

  return next(cleanReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Network / CORS / offline error
      if (error.status === 0) {
        if (!silent) toast.error('Network error — please check your connection.');
        return throwError(() => ({
          status: 0,
          message: 'Network error — please check your connection.',
        }));
      }

      // 403 — authenticated but not allowed
      if (error.status === 403) {
        if (!silent) toast.warning('You don\'t have permission to access this resource.');
        router.navigate(['/dashboard']);
        return throwError(() => ({
          status: 403,
          message: 'You do not have permission to access this resource.',
        }));
      }

      // 500+ — server error
      if (error.status >= 500) {
        console.error(`[SkillSwap] Server Error ${error.status}:`, error.message);
        if (!silent) toast.error('A server error occurred. Please try again later.');
        return throwError(() => ({
          status: error.status,
          message: 'A server error occurred. Please try again later.',
        }));
      }

      // All other errors (400, 404, 409, 422) — pass through as-is
      // so services and components can handle them specifically
      return throwError(() => error);
    })
  );
};
