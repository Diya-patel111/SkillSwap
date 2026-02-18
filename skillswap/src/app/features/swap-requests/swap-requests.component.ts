import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SwapRequestService } from '../../core/services/swap-request.service';
import { ReviewService } from '../../core/services/review.service';
import { ToastService } from '../../core/services/toast.service';
import { SwapRequest, SwapStatus } from '../../core/models/swap-request.model';

type Tab = 'incoming' | 'sent';

@Component({
  selector: 'app-swap-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, SidebarComponent, StarRatingComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="min-h-screen flex bg-background-light dark:bg-background-dark">
      <app-sidebar />

      <div class="flex-1 ml-64 flex flex-col min-h-screen">
        <!-- Header -->
        <header class="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">Swap Requests</h1>
            <p class="text-sm text-slate-500">Manage your incoming &amp; sent skill trade requests</p>
          </div>
          <a routerLink="/skills" class="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
            <span class="material-symbols-outlined text-[20px]">add</span> Propose Swap
          </a>
        </header>

        <!-- Main Content -->
        <main class="flex-1 p-8 space-y-6">
          <!-- Tabs -->
          <div class="flex gap-2 bg-white dark:bg-slate-900 rounded-2xl p-1.5 w-fit border border-slate-100 dark:border-slate-800">
            <button (click)="setTab('incoming')"
              [class]="activeTab === 'incoming' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <span class="material-symbols-outlined text-[18px]">move_to_inbox</span>
              Incoming
              @if (incoming.length > 0) {
                <span class="bg-white/20 text-current text-xs rounded-full px-1.5 py-0.5">{{ incoming.length }}</span>
              }
            </button>
            <button (click)="setTab('sent')"
              [class]="activeTab === 'sent' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <span class="material-symbols-outlined text-[18px]">send</span>
              Sent
              @if (sent.length > 0) {
                <span class="bg-white/20 text-current text-xs rounded-full px-1.5 py-0.5">{{ sent.length }}</span>
              }
            </button>
          </div>

          <!-- Loading -->
          @if (isLoading) {
            <app-skeleton variant="card" [count]="4" />
          }

          <!-- Empty State -->
          @if (!isLoading && activeList.length === 0) {
            <app-empty-state
              variant="no-swaps"
              [title]="activeTab === 'incoming' ? 'No incoming requests' : 'No sent requests'"
              [body]="activeTab === 'incoming'
                ? 'When someone requests a skill swap with you, it will appear here.'
                : 'Browse students and propose a skill trade to get started.'"
              [ctaLabel]="activeTab === 'sent' ? 'Browse Students' : ''"
              ctaRoute="/skills"
              ctaIcon="search" />
          }

          <!-- Request Cards -->
          @if (!isLoading && activeList.length > 0) {
            <div class="space-y-3">
              @for (req of activeList; track req._id) {
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex items-start gap-4">
                  <!-- Avatar -->
                  <a [routerLink]="['/profile', activeTab === 'incoming' ? req.senderId._id : req.receiverId._id]"
                     class="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10
                            flex items-center justify-center text-primary font-bold text-lg shrink-0
                            hover:ring-2 hover:ring-primary transition-all cursor-pointer">
                    {{ getInitials(activeTab === 'incoming' ? req.senderId.name : req.receiverId.name) }}
                  </a>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <a [routerLink]="['/profile', activeTab === 'incoming' ? req.senderId._id : req.receiverId._id]"
                         class="font-bold text-slate-900 dark:text-white text-sm hover:text-primary
                                transition-colors cursor-pointer">
                        {{ activeTab === 'incoming' ? req.senderId.name : req.receiverId.name }}
                      </a>
                      <span [class]="getBadgeClass(req.status)" class="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {{ req.status | titlecase }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Teaches
                      <span class="font-semibold text-primary">{{ req.offeredSkill }}</span>
                      &rarr; Wants
                      <span class="font-semibold text-emerald-500">{{ req.requestedSkill }}</span>
                    </p>
                    @if (req.message) {
                      <p class="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 italic">"{{ req.message }}"</p>
                    }
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-2 shrink-0">
                    @if (req.status === 'pending' && activeTab === 'incoming') {
                      <button (click)="accept(req._id!)"
                        class="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <span class="material-symbols-outlined text-[18px]">check_circle</span> Accept
                      </button>
                      <button (click)="reject(req._id!)"
                        class="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <span class="material-symbols-outlined text-[18px]">cancel</span> Decline
                      </button>
                    }
                    @if (req.status === 'pending' && activeTab === 'sent') {
                      <button (click)="cancel(req._id!)"
                        class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <span class="material-symbols-outlined text-[18px]">close</span> Cancel
                      </button>
                    }
                    @if (req.status === 'accepted') {
                      <a routerLink="/sessions"
                        class="flex items-center gap-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <span class="material-symbols-outlined text-[18px]">event</span>
                        Schedule
                      </a>
                      <button (click)="markComplete(req)"
                        [disabled]="completing() === req._id"
                        class="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <span class="material-symbols-outlined text-[18px]">task_alt</span>
                        {{ completing() === req._id ? 'Completing…' : 'Mark Complete' }}
                      </button>
                    }
                    @if ((req.status === 'accepted' || req.status === 'completed') && !req.reviewed) {
                      <button (click)="openReview(req)"
                        class="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <span class="material-symbols-outlined text-[18px]">star</span> Review
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </main>
      </div>
    </div>

    <!-- ── Review Modal ───────────────────────────────────────────────────── -->
    @if (reviewTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
           (click)="closeReview()">
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-8"
             (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Leave a Review</h3>
            <button (click)="closeReview()" class="text-slate-400 hover:text-slate-600"
              aria-label="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Swap info -->
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Swap with
            <span class="font-semibold text-slate-700 dark:text-slate-200">
              {{ activeTab === 'incoming' ? reviewTarget()!.senderId.name : reviewTarget()!.receiverId.name }}
            </span>
          </p>

          <!-- Star picker -->
          <div class="mb-6">
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Rating <span class="text-red-400">*</span></p>
            <app-star-rating
              [value]="reviewRating()"
              [interactive]="true"
              size="lg"
              (valueChange)="reviewRating.set($event)" />
          </div>

          <!-- Comment -->
          <div class="mb-6">
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Comment (optional)</label>
            <textarea [formControl]="reviewComment" rows="4"
              placeholder="Share your experience..."
              class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800
                     text-slate-800 dark:text-slate-200 text-sm px-4 py-3 focus:outline-none focus:ring-2
                     focus:ring-primary/40 resize-none"></textarea>
          </div>

          <!-- Error -->
          @if (reviewError()) {
            <p class="text-sm text-red-500 mb-4">{{ reviewError() }}</p>
          }

          <!-- Actions -->
          <div class="flex gap-3">
            <button (click)="closeReview()" type="button"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                     text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50
                     dark:hover:bg-slate-800 transition-all">
              Cancel
            </button>
            <button (click)="submitReview()" type="button"
              [disabled]="reviewRating() === 0 || submitting()"
              class="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold
                     hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {{ submitting() ? 'Submitting...' : 'Submit Review' }}
            </button>
          </div>
        </div>
      </div>
    }

  `,
})
export class SwapRequestsComponent implements OnInit {
  private swapService   = inject(SwapRequestService);
  private reviewService = inject(ReviewService);
  private toast         = inject(ToastService);

  incoming: SwapRequest[] = [];
  sent: SwapRequest[]     = [];
  isLoading  = true;
  activeTab: Tab = 'incoming';

  // ── Review modal state ──
  readonly completing    = signal<string | null>(null);
  readonly reviewTarget  = signal<SwapRequest | null>(null);
  readonly reviewRating  = signal(0);
  readonly reviewComment = new FormControl('', Validators.maxLength(1000));
  readonly submitting    = signal(false);
  readonly reviewError   = signal<string | null>(null);

  get activeList(): SwapRequest[] {
    return this.activeTab === 'incoming' ? this.incoming : this.sent;
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    this.swapService.getMyRequests().subscribe({
      next: (res) => {
        // Filter out swaps where the other party's account has been deleted (null after populate)
        this.incoming = res.received.filter(r => r.senderId != null && r.receiverId != null);
        this.sent     = res.sent.filter(r => r.senderId != null && r.receiverId != null);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  accept(id: string): void {
    this.swapService.acceptSwap(id).subscribe({
      next: () => {
        const req = this.incoming.find(r => r._id === id);
        if (req) req.status = 'accepted';
        this.toast.success('Request accepted!');
      },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to accept request.'),
    });
  }

  reject(id: string): void {
    this.swapService.rejectSwap(id).subscribe({
      next: () => {
        const req = this.incoming.find(r => r._id === id);
        if (req) req.status = 'rejected';
        this.toast.info('Request declined.');
      },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to decline request.'),
    });
  }

  cancel(id: string): void {
    this.swapService.cancelSwap(id).subscribe({
      next: () => {
        const req = this.sent.find(r => r._id === id);
        if (req) req.status = 'cancelled';
        this.toast.info('Request cancelled.');
      },
      error: (err) => this.toast.error(err?.error?.message ?? 'Failed to cancel request.'),
    });
  }

  markComplete(req: SwapRequest): void {
    if (!req._id) return;
    this.completing.set(req._id);
    this.swapService.completeSwap(req._id).subscribe({
      next: () => {
        req.status = 'completed';
        this.completing.set(null);
        // Auto-open review modal so user can immediately rate the swap
        this.openReview(req);
      },
      error: () => this.completing.set(null),
    });
  }

  openReview(req: SwapRequest): void {
    this.reviewTarget.set(req);
    this.reviewRating.set(0);
    this.reviewComment.reset('');
    this.reviewError.set(null);
  }

  closeReview(): void {
    this.reviewTarget.set(null);
    this.submitting.set(false);
  }

  submitReview(): void {
    const target = this.reviewTarget();
    if (!target || this.reviewRating() === 0) return;
    this.submitting.set(true);
    this.reviewError.set(null);

    this.reviewService.createReview({
      swapRequestId: target._id!,
      rating: this.reviewRating(),
      comment: this.reviewComment.value ?? '',
    }).subscribe({
      next: () => {
        // Mark locally as reviewed so button disappears
        target.reviewed = true;
        this.closeReview();
        this.toast.success('Review submitted successfully!');
      },
      error: (err) => {
        this.submitting.set(false);
        this.reviewError.set(err?.error?.message ?? 'Failed to submit review. Please try again.');
      },
    });
  }

  getInitials(name: string | undefined | null): string {
    if (!name) return '?';
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '??';
  }

  getBadgeClass(status: SwapStatus): string {
    const map: Record<SwapStatus, string> = {
      pending:   'bg-amber-100 text-amber-700',
      accepted:  'bg-emerald-100 text-emerald-700',
      rejected:  'bg-red-100 text-red-600',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-slate-100 text-slate-500',
    };
    return map[status] ?? 'bg-slate-100 text-slate-500';
  }
}
