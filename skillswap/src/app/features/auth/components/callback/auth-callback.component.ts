import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * Handles the redirect from the backend after Google OAuth.
 * URL shape: /auth/callback?token=<jwt>&refreshToken=<jwt>
 *
 * On success → stores tokens → navigates to /dashboard.
 * On failure → navigates to /auth/login?error=oauth_failed.
 */
@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center
                bg-background-light dark:bg-background-dark gap-4">
      <div class="bg-primary text-white p-3 rounded-xl">
        <span class="material-symbols-outlined text-3xl animate-spin">refresh</span>
      </div>
      <p class="text-slate-500 dark:text-slate-400 text-sm">Completing sign-in…</p>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const params       = this.route.snapshot.queryParamMap;
    const token        = params.get('token');
    const refreshToken = params.get('refreshToken');
    const error        = params.get('error');

    if (error || !token || !refreshToken) {
      this.router.navigate(['/auth/login'], {
        queryParams: { error: error ?? 'oauth_failed' },
      });
      return;
    }

    // handleOAuthCallback now returns an Observable — subscribe so the
    // /auth/me request fires and user state is hydrated before we navigate.
    this.authService.handleOAuthCallback(token, refreshToken).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.router.navigate(['/auth/login'], {
        queryParams: { error: 'oauth_failed' },
      }),
    });
  }
}
