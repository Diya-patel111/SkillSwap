import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { AuthService } from './core/services/auth.service';

/**
 * APP_INITIALIZER factory — runs before the first route guard fires.
 *
 * If a valid JWT exists in localStorage:
 *   1. Hydrates `UserStateService` from cached localStorage user (instant).
 *   2. Calls /auth/me in the background to re-validate and refresh user data.
 *   3. On 401 / network error → silently logs out so guards redirect cleanly.
 *
 * If no token → returns immediately (of(null)) so the app boots fast.
 */
function initSession(auth: AuthService) {
  return () => auth.isAuthenticated() ? auth.restoreSession() : of(null);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    // Interceptor order: loading tracker → JWT token injection → global error handling
    provideHttpClient(withInterceptors([loadingInterceptor, jwtInterceptor, errorInterceptor])),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initSession,
      deps: [AuthService],
      multi: true,
    },
  ],
};
