import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemeToggleComponent],
  template: `
    <header class="sticky top-0 z-50 w-full bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2">
            <div class="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl">swap_calls</span>
            </div>
            <span class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SkillSwap</span>
          </a>

          <!-- Desktop Nav -->
          <nav class="hidden md:flex items-center gap-8">
            @if (isLoggedIn) {
              <a routerLink="/dashboard" routerLinkActive="text-primary"
                 class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Dashboard</a>
              <a routerLink="/skills" routerLinkActive="text-primary"
                 class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Browse Skills</a>
              <a routerLink="/profile" routerLinkActive="text-primary"
                 class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Profile</a>
            } @else {
              <a routerLink="/" fragment="how" class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">How it Works</a>
              <a routerLink="/skills" class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Skills</a>
            }
          </nav>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <app-theme-toggle />
            @if (isLoggedIn) {
              <a routerLink="/profile" class="h-9 w-9 rounded-full bg-primary/10 border-2 border-primary/20 overflow-hidden cursor-pointer flex items-center justify-center">
                <span class="material-symbols-outlined text-primary">person</span>
              </a>
              <button (click)="logout()" class="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200
                hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                Logout
              </button>
            } @else {
              <a routerLink="/auth/login"
                 class="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                Login
              </a>
              <a routerLink="/auth/register"
                 class="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm shadow-primary/20 transition-all">
                Join Now
              </a>
            }
          </div>
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  private authService = inject(AuthService);
  themeService = inject(ThemeService);

  get isLoggedIn() { return this.authService.isAuthenticated(); }

  logout() { this.authService.logout(); }
}
