import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiError } from '../../../../core/models/api-response.model';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ThemeToggleComponent],
  template: `
    <div class="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">

      <!-- ── Header ───────────────────────────────────────────────── -->
      <header class="w-full bg-white dark:bg-background-dark border-b border-slate-200
                     dark:border-slate-800 px-6 lg:px-40 py-4 flex items-center
                     justify-between sticky top-0 z-50">
        <a routerLink="/" class="flex items-center gap-2">
          <div class="bg-primary text-white p-1.5 rounded-lg">
            <span class="material-symbols-outlined text-xl">swap_calls</span>
          </div>
          <h1 class="text-slate-900 dark:text-white text-xl font-bold tracking-tight">SkillSwap</h1>
        </a>
        <div class="flex items-center gap-4">
          <app-theme-toggle />
          <span class="hidden md:block text-sm text-slate-500 dark:text-slate-400">Don't have an account?</span>
          <a routerLink="/auth/register" class="text-sm font-bold text-primary hover:underline">Sign up</a>
        </div>
      </header>

      <!-- ── Main ─────────────────────────────────────────────────── -->
      <main class="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div class="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-xl
                    border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div class="p-8 lg:p-10">

            <!-- Title -->
            <div class="mb-8 text-center">
              <h2 class="text-slate-900 dark:text-white text-3xl font-black leading-tight
                         tracking-tight mb-2">Welcome Back</h2>
              <p class="text-slate-500 dark:text-slate-400 text-base">
                Log in to continue learning and sharing.
              </p>
            </div>

            <!-- OAuth error banner -->
            @if (oauthError) {
              <div class="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200
                          dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400
                          text-sm flex items-start gap-2">
                <span class="material-symbols-outlined text-base mt-0.5 flex-shrink-0">warning</span>
                {{ oauthError }}
              </div>
            }

            <!-- ── Google SSO ─────────────────────────────────────── -->
            <button
              type="button"
              (click)="loginWithGoogle()"
              [disabled]="isGoogleLoading"
              class="w-full flex items-center justify-center gap-3 h-12 px-4 mb-6
                     border border-slate-200 dark:border-slate-700 rounded-lg
                     hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                     text-sm font-semibold text-slate-900 dark:text-white
                     disabled:opacity-60">
              @if (isGoogleLoading) {
                <span class="material-symbols-outlined animate-spin text-base">refresh</span>
              } @else {
                <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.52 12.27c0-.85-.07-1.67-.21-2.46H12v4.65h6.46a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.1A11.99 11.99 0 0 0 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.28A7.22 7.22 0 0 1 4.89 12c0-.8.14-1.57.38-2.28V6.62H1.28A11.99 11.99 0 0 0 0 12c0 1.93.46 3.76 1.28 5.38l3.99-3.1z"/>
                  <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.61 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.62l3.99 3.1C6.22 6.87 8.87 4.76 12 4.76z"/>
                </svg>
              }
              Continue with Google
            </button>

            <!-- Divider -->
            <div class="relative mb-6">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-white dark:bg-slate-900 px-4 text-slate-500 font-medium tracking-wider">
                  Or continue with email
                </span>
              </div>
            </div>

            <!-- General error banner -->
            @if (generalError) {
              <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200
                          dark:border-red-800 rounded-lg text-red-700 dark:text-red-400
                          text-sm flex items-start gap-2">
                <span class="material-symbols-outlined text-base mt-0.5 flex-shrink-0">error</span>
                {{ generalError }}
              </div>
            }

            <!-- ── Form ───────────────────────────────────────────── -->
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">

              <!-- Email -->
              <div class="flex flex-col gap-1.5">
                <label class="text-slate-900 dark:text-slate-200 text-sm font-semibold
                              flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">mail</span> Email Address
                </label>
                <input
                  formControlName="email"
                  type="email"
                  placeholder="name@example.com"
                  autocomplete="email"
                  class="w-full h-12 px-4 rounded-lg border dark:bg-slate-800 dark:text-white
                         outline-none transition-all focus:ring-2 focus:ring-primary/20
                         focus:border-primary dark:border-slate-700 border-slate-200"
                  [class.border-red-400]="hasError('email')" />
                @if (fieldMessage('email'); as msg) {
                  <p class="text-red-500 text-xs">{{ msg }}</p>
                }
              </div>

              <!-- Password -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between items-center">
                  <label class="text-slate-900 dark:text-slate-200 text-sm font-semibold
                                flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">lock</span> Password
                  </label>
                  <a href="#" class="text-xs text-primary hover:underline">Forgot password?</a>
                </div>
                <div class="relative">
                  <input
                    formControlName="password"
                    [type]="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                    autocomplete="current-password"
                    class="w-full h-12 pl-4 pr-10 rounded-lg border dark:bg-slate-800 dark:text-white
                           outline-none transition-all focus:ring-2 focus:ring-primary/20
                           focus:border-primary dark:border-slate-700 border-slate-200"
                    [class.border-red-400]="hasError('password')" />
                  <button type="button" (click)="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                           hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-[20px]">
                      {{ showPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
                @if (fieldMessage('password'); as msg) {
                  <p class="text-red-500 text-xs">{{ msg }}</p>
                }
              </div>

              <!-- Submit -->
              <div class="pt-4">
                <button
                  type="submit"
                  [disabled]="isLoading"
                  class="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white
                         font-bold rounded-lg shadow-lg shadow-primary/20 transition-all
                         flex items-center justify-center gap-2 text-base">
                  @if (isLoading) {
                    <span class="material-symbols-outlined animate-spin">refresh</span>
                  } @else {
                    Log In <span class="material-symbols-outlined">arrow_forward</span>
                  }
                </button>
              </div>
            </form>

            <p class="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
              By logging in, you agree to SkillSwap's
              <a href="#" class="text-primary hover:underline">Terms of Service</a> and
              <a href="#" class="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </main>

      <footer class="py-6 text-center">
        <p class="text-slate-500 text-sm">© 2025 SkillSwap Academic Network. All rights reserved.</p>
      </footer>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);

  loginForm: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  isLoading       = false;
  isGoogleLoading = false;
  showPassword    = false;
  generalError: string | null = null;
  oauthError:   string | null = null;

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error === 'oauth_failed') {
      this.oauthError = 'Google sign-in was cancelled or failed. Please try again.';
    }
  }

  hasError(field: string): boolean {
    const c = this.ctrl(field);
    return !!(c?.invalid && (c.touched || c.dirty));
  }

  fieldMessage(field: string): string | null {
    const c = this.ctrl(field);
    if (!c || !(c.touched || c.dirty) || c.valid) return null;
    if (c.errors?.['serverError']) return c.errors['serverError'];
    if (field === 'email') {
      if (c.errors?.['required']) return 'Email is required.';
      if (c.errors?.['email'])    return 'Please enter a valid email address.';
    }
    if (field === 'password') {
      if (c.errors?.['required']) return 'Password is required.';
    }
    return null;
  }

  loginWithGoogle(): void {
    this.isGoogleLoading = true;
    this.authService.initiateGoogleLogin();
  }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;

    this.isLoading    = true;
    this.generalError = null;

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: ApiError) => {
        this.isLoading = false;
        this.applyServerErrors(err);
      },
    });
  }

  private ctrl(field: string): AbstractControl | null {
    return this.loginForm.get(field);
  }

  private applyServerErrors(err: ApiError): void {
    if (err.errors?.length) {
      let linkedToField = false;
      err.errors.forEach(e => {
        const c = this.loginForm.get(e.field);
        if (c) { c.setErrors({ serverError: e.message }); c.markAsTouched(); linkedToField = true; }
      });
      if (!linkedToField) this.generalError = err.message || 'Login failed. Please try again.';
    } else {
      this.generalError = err.message || 'Invalid email or password. Please try again.';
    }
  }
}
