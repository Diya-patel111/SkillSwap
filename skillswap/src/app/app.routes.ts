import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { LandingComponent } from './features/landing/landing.component';

export const routes: Routes = [
  // Public landing
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full',
  },

  // Auth routes (guests only)
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/components/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  // OAuth callback — no guard (arrives unauthenticated, sets tokens, then redirects)
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/components/callback/auth-callback.component').then(m => m.AuthCallbackComponent),
  },

  // Protected routes
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile/:id',
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
  },

  // Skills browse (public)
  {
    path: 'skills',
    loadComponent: () =>
      import('./features/skills/skills-browse.component').then(m => m.SkillsBrowseComponent),
  },
  { path: 'skills/browse', redirectTo: 'skills', pathMatch: 'full' },

  // Swap requests (protected)
  {
    path: 'swaps',
    loadComponent: () =>
      import('./features/swap-requests/swap-requests.component').then(m => m.SwapRequestsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'swaps/propose/:id',
    loadComponent: () =>
      import('./features/swap-requests/components/propose-swap/propose-swap.component').then(
        m => m.ProposeSwapComponent
      ),
    canActivate: [authGuard],
  },

  // My Skills (protected)
  {
    path: 'my-skills',
    loadComponent: () =>
      import('./features/my-skills/my-skills.component').then(m => m.MySkillsComponent),
    canActivate: [authGuard],
  },

  // Messages (protected)
  {
    path: 'messages',
    loadComponent: () =>
      import('./features/messages/messages.component').then(m => m.MessagesComponent),
    canActivate: [authGuard],
  },

  // Sessions (protected)
  {
    path: 'sessions',
    loadComponent: () =>
      import('./features/sessions/sessions.component').then(m => m.SessionsComponent),
    canActivate: [authGuard],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
