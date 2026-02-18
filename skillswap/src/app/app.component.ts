import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { TopProgressBarComponent } from './shared/components/top-progress-bar/top-progress-bar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TopProgressBarComponent, ToastContainerComponent],
  template: `
    <app-top-progress-bar />
    <app-toast-container />
    <router-outlet />
  `,
})
export class AppComponent {
  // Inject ThemeService so its constructor effect() fires immediately on boot
  readonly themeService = inject(ThemeService);
}
