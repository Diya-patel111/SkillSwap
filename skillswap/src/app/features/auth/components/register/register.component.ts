import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiError } from '../../../../core/models/api-response.model';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';

/** Cross-field validator: password and confirmPassword must match. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw  = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ThemeToggleComponent],
  template: `
    <div class="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      <!-- Header -->
      <header class="w-full bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 lg:px-40 py-4 flex items-center justify-between sticky top-0 z-50">
        <a routerLink="/" class="flex items-center gap-2">
          <div class="bg-primary text-white p-1.5 rounded-lg">
            <span class="material-symbols-outlined text-xl">swap_calls</span>
          </div>
          <h1 class="text-slate-900 dark:text-white text-xl font-bold tracking-tight">SkillSwap</h1>
        </a>
        <div class="flex items-center gap-4">
          <app-theme-toggle />
          <span class="hidden md:block text-sm text-slate-500 dark:text-slate-400">Already have an account?</span>
          <a routerLink="/auth/login" class="text-sm font-bold text-primary hover:underline">Log in</a>
        </div>
      </header>

      <!-- Main -->
      <main class="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div class="w-full max-w-[540px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div class="p-8 lg:p-10">
            <!-- Header -->
            <div class="mb-8 text-center">
              <h2 class="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight mb-2">Join the Community</h2>
              <p class="text-slate-500 dark:text-slate-400 text-base">Connect with fellow students to trade skills and knowledge.</p>
            </div>

            <!-- ── Google SSO ─────────────────────────────────────── -->
            <button
              type="button"
              (click)="signUpWithGoogle()"
              [disabled]="isGoogleLoading"
              class="w-full flex items-center justify-center gap-3 h-12 px-4 mb-8
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

            <div class="relative mb-8">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-white dark:bg-slate-900 px-4 text-slate-500 font-medium tracking-wider">Or continue with email</span>
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

            <!-- Form -->
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-5">
              <!-- Name -->
              <div class="flex flex-col gap-1.5">
                <label class="text-slate-900 dark:text-slate-200 text-sm font-semibold flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">person</span> Full Name
                </label>
                <input formControlName="name" type="text" placeholder="John Doe"
                  class="w-full h-12 px-4 rounded-lg border dark:bg-slate-800 dark:text-white dark:border-slate-700 border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  [class.border-red-400]="hasError('name')" />
                @if (fieldMessage('name'); as msg) { <p class="text-red-500 text-xs">{{ msg }}</p> }
              </div>

              <!-- Email -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between items-center">
                  <label class="text-slate-900 dark:text-slate-200 text-sm font-semibold flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">mail</span> Email Address
                  </label>
                  <span class="text-[10px] font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded uppercase tracking-wider">Required</span>
                </div>
                <input formControlName="email" type="email" placeholder="name@example.com"
                  class="w-full h-12 px-4 rounded-lg border dark:bg-slate-800 dark:text-white dark:border-slate-700 border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  [class.border-red-400]="hasError('email')" />
                <p class="text-slate-500 text-xs">Enter any valid email address</p>
                @if (fieldMessage('email'); as msg) { <p class="text-red-500 text-xs">{{ msg }}</p> }
              </div>

              <!-- Major -->
              <div class="flex flex-col gap-1.5">
                <label class="text-slate-900 dark:text-slate-200 text-sm font-semibold flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">school</span> Major
                </label>
                <input formControlName="major" type="text" placeholder="e.g., Computer Science"
                  class="w-full h-12 px-4 rounded-lg border dark:bg-slate-800 dark:text-white dark:border-slate-700 border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>

              <!-- Password -->
              <div class="flex flex-col gap-1.5">
                <label class="text-slate-900 dark:text-slate-200 text-sm font-semibold flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">lock</span> Password
                </label>
                <div class="relative">
                  <input formControlName="password" [type]="showPassword ? 'text' : 'password'" placeholder="Min 8 chars, 1 uppercase, 1 number"
                    autocomplete="new-password"
                    class="w-full h-12 pl-4 pr-10 rounded-lg border dark:bg-slate-800 dark:text-white dark:border-slate-700 border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    [class.border-red-400]="hasError('password')" />
                  <button type="button" (click)="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-[20px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
                @if (fieldMessage('password'); as msg) { <p class="text-red-500 text-xs">{{ msg }}</p> }
              </div>

              <!-- Confirm Password -->
              <div class="flex flex-col gap-1.5">
                <label class="text-slate-900 dark:text-slate-200 text-sm font-semibold flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">lock_reset</span> Confirm Password
                </label>
                <input formControlName="confirmPassword" [type]="showPassword ? 'text' : 'password'" placeholder="Re-enter password"
                  autocomplete="new-password"
                  class="w-full h-12 px-4 rounded-lg border dark:bg-slate-800 dark:text-white dark:border-slate-700 border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  [class.border-red-400]="hasError('confirmPassword') || (registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmPassword')?.touched)" />
                @if (registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmPassword')?.touched) {
                  <p class="text-red-500 text-xs">Passwords do not match.</p>
                }
              </div>

              <!-- Submit -->
              <div class="pt-4">
                <button type="submit" [disabled]="isLoading"
                  class="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-base">
                  @if (isLoading) {
                    <span class="material-symbols-outlined animate-spin">refresh</span>
                  } @else {
                    Create Account <span class="material-symbols-outlined">arrow_forward</span>
                  }
                </button>
              </div>
            </form>

            <p class="mt-8 text-center text-xs text-slate-500 dark:text-slate-500 leading-relaxed px-4">
              By creating an account, you agree to SkillSwap's
              <a href="#" class="text-primary hover:underline">Terms of Service</a> and
              <a href="#" class="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </main>

      <footer class="py-6 text-center">
        <p class="text-slate-500 text-sm">© 2024 SkillSwap Academic Network. All rights reserved.</p>
      </footer>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);

  registerForm: FormGroup = this.fb.group({
    name:            ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email:           ['', [Validators.required, Validators.email]],
    major:           [''],
    password:        ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/[A-Z]/),   // at least 1 uppercase
      Validators.pattern(/[0-9]/),   // at least 1 digit
    ]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  isLoading       = false;
  isGoogleLoading = false;
  showPassword    = false;
  generalError: string | null = null;

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error === 'oauth_failed') {
      this.generalError = 'Google sign-up was cancelled or failed. Please try again.';
    }
  }

  hasError(field: string): boolean {
    const c = this.ctrl(field);
    return !!(c?.invalid && (c.touched || c.dirty));
  }

  fieldMessage(field: string): string | null {
    const c = this.ctrl(field);
    if (!c || !(c.touched || c.dirty) || c.valid) return null;
    if (c.errors?.['serverError'])  return c.errors['serverError'];
    if (field === 'name') {
      if (c.errors?.['required'])    return 'Full name is required.';
      if (c.errors?.['minlength'])   return 'Name must be at least 2 characters.';
    }
    if (field === 'email') {
      if (c.errors?.['required'])    return 'Email is required.';
      if (c.errors?.['email'])       return 'Please enter a valid email address.';
    }
    if (field === 'password') {
      if (c.errors?.['required'])    return 'Password is required.';
      if (c.errors?.['minlength'])   return 'Password must be at least 8 characters.';
      if (c.errors?.['pattern'])     return 'Password must contain at least one uppercase letter and one number.';
    }
    return null;
  }

  signUpWithGoogle(): void {
    this.isGoogleLoading = true;
    this.authService.initiateGoogleLogin();
  }

  onSubmit(): void {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.invalid) return;

    this.isLoading    = true;
    this.generalError = null;

    // Strip confirmPassword before sending to backend
    const { confirmPassword, ...payload } = this.registerForm.value;

    this.authService.register(payload).subscribe({
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
    return this.registerForm.get(field);
  }

  private applyServerErrors(err: ApiError): void {
    if (err.errors?.length) {
      let linkedToField = false;
      err.errors.forEach(e => {
        const c = this.registerForm.get(e.field);
        if (c) { c.setErrors({ serverError: e.message }); c.markAsTouched(); linkedToField = true; }
      });
      if (!linkedToField) this.generalError = err.message || 'Registration failed. Please try again.';
    } else {
      this.generalError = err.message || 'Registration failed. Please try again.';
    }
  }
}
