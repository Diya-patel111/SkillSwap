import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/**
 * LoadingInterceptor — increments the global loading counter for every
 * outgoing request and decrements it when the response (or error) lands.
 *
 * Skipped for requests that set the custom header `X-Skip-Loading: true`
 * (e.g. background polls or silent refresh calls).
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Skip-Loading')) {
    return next(req.clone({ headers: req.headers.delete('X-Skip-Loading') }));
  }

  const loader = inject(LoadingService);
  loader.increment();

  return next(req).pipe(
    finalize(() => loader.decrement()),
  );
};
