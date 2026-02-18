import {
  Component, inject, ChangeDetectionStrategy, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

/**
 * Global top progress bar — NProgress-style thin bar at the very top
 * of the viewport. Mounts once in AppComponent.
 */
@Component({
  selector: 'app-top-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (loading.isLoading()) {
      <div
        class="fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden"
        role="progressbar"
        aria-label="Loading"
        aria-busy="true">
        <!-- Animated bar -->
        <div class="h-full bg-primary animate-progress-bar origin-left rounded-r-full
                    shadow-[0_0_8px_2px_rgba(75,145,226,0.6)]"></div>
      </div>
    }
  `,
  styles: [`
    @keyframes progress-bar {
      0%   { transform: scaleX(0);    margin-left: 0; }
      50%  { transform: scaleX(0.7);  margin-left: 0; }
      100% { transform: scaleX(1);    margin-left: 0; }
    }
    .animate-progress-bar {
      animation: progress-bar 1.2s ease-in-out infinite;
    }
  `],
})
export class TopProgressBarComponent {
  readonly loading = inject(LoadingService);
}
