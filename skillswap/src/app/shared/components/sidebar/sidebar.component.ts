import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UserStateService } from '../../../core/services/user-state.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemeToggleComponent],
  template: `
    <aside class="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-full z-20">
      <div class="p-6 flex flex-col h-full">
        <!-- Logo -->
        <a routerLink="/dashboard" class="flex items-center gap-3 mb-8">
          <div class="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
            <span class="material-symbols-outlined text-2xl">swap_calls</span>
          </div>
          <div>
            <h1 class="text-primary text-lg font-bold leading-tight">SkillSwap</h1>
            <p class="text-slate-500 text-xs font-medium">Peer-to-Peer Learning</p>
          </div>
        </a>

        <!-- Nav Links -->
        <nav class="flex flex-col gap-1 flex-1">
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span class="material-symbols-outlined">{{ item.icon }}</span>
              <span class="text-sm">{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- User Info + Theme Toggle -->
        <div class="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
          <!-- Theme toggle row -->
          <div class="flex items-center justify-between mb-4 px-1">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Appearance</span>
            <app-theme-toggle />
          </div>
          <div class="flex items-center gap-3">
            @if (userState.userAvatar()) {
              <img [src]="userState.userAvatar()" alt="avatar"
                   class="size-10 rounded-full object-cover" />
            } @else {
              <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span class="text-primary font-bold text-sm">{{ userState.userInitials() }}</span>
              </div>
            }
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold truncate text-slate-900 dark:text-white">{{ userState.fullName() }}</p>
              <p class="text-xs text-slate-500 truncate">{{ userState.userRole() }}</p>
            </div>
            <button (click)="logout()" class="text-slate-400 hover:text-red-500 transition-colors" title="Logout">
              <span class="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  readonly userState = inject(UserStateService);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Profile', icon: 'person', route: '/profile' },
    { label: 'My Skills', icon: 'auto_stories', route: '/my-skills' },
    { label: 'Browse Skills', icon: 'search', route: '/skills' },
    { label: 'Swap Requests', icon: 'swap_horiz', route: '/swaps' },
    { label: 'Sessions', icon: 'event', route: '/sessions' },
    { label: 'Messages', icon: 'chat_bubble', route: '/messages' },
  ];

  logout(): void {
    this.authService.logout();
  }
}
