import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
  HttpContext,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiError } from '../models/api-response.model';

/** Optional query parameters — passed as plain key-value pairs */
export type QueryParams = Record<string, string | number | boolean | undefined | null>;

/**
 * ApiService — the single HTTP gateway for the SkillSwap app.
 *
 * All feature services inject this instead of HttpClient directly.
 * Responsibilities:
 *   - Prepend environment.apiUrl to every path
 *   - Build HttpParams from a plain object
 *   - Normalize every HttpErrorResponse into a typed ApiError
 *
 * Token injection and 401 handling are handled by the interceptors,
 * keeping this service stateless and easy to test.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ── Core HTTP verbs ─────────────────────────────────────────────────────

  get<T>(path: string, params?: QueryParams, context?: HttpContext): Observable<T> {
    return this.http
      .get<T>(this.url(path), { params: this.buildParams(params), context })
      .pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: unknown = {}, context?: HttpContext): Observable<T> {
    return this.http
      .post<T>(this.url(path), body, { context })
      .pipe(catchError(this.handleError));
  }

  put<T>(path: string, body: unknown = {}, context?: HttpContext): Observable<T> {
    return this.http
      .put<T>(this.url(path), body, { context })
      .pipe(catchError(this.handleError));
  }

  patch<T>(path: string, body: unknown = {}, context?: HttpContext): Observable<T> {
    return this.http
      .patch<T>(this.url(path), body, { context })
      .pipe(catchError(this.handleError));
  }

  delete<T>(path: string, context?: HttpContext): Observable<T> {
    return this.http
      .delete<T>(this.url(path), { context })
      .pipe(catchError(this.handleError));
  }

  /** Multipart POST — for creating resources with file upload (e.g. POST to upload-only endpoints) */
  upload<T>(path: string, formData: FormData): Observable<T> {
    return this.http
      .post<T>(this.url(path), formData)
      .pipe(catchError(this.handleError));
  }

  /** Multipart PUT — for updating resources that include an optional file upload */
  uploadPut<T>(path: string, formData: FormData): Observable<T> {
    return this.http
      .put<T>(this.url(path), formData)
      .pipe(catchError(this.handleError));
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Prepend base API URL to a relative path */
  private url(path: string): string {
    // Allow callers to pass '/users/me' or 'users/me' — both work
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${this.base}${clean}`;
  }

  /** Convert a plain object to HttpParams, skipping null / undefined values */
  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }

  /**
   * Map HttpErrorResponse → ApiError.
   * The error is re-thrown so feature services / components can catch it.
   */
  private handleError(err: HttpErrorResponse): Observable<never> {
    const apiError: ApiError = {
      status:  err.status,
      message: err.error?.message ?? err.message ?? 'An unexpected error occurred',
      errors:  err.error?.errors ?? [],
    };
    return throwError(() => apiError);
  }
}
