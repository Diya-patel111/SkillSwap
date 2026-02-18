import {
  Component, OnInit, OnDestroy,
  inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent }  from '../../shared/components/sidebar/sidebar.component';
import { UserStateService }  from '../../core/services/user-state.service';
import { ProfileService }    from '../../core/services/profile.service';
import { ToastService }      from '../../core/services/toast.service';

const CATEGORIES = [
  'Coding', 'Languages', 'Music', 'Design',
  'Marketing', 'Writing', 'Mathematics', 'Science', 'Other',
];

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
type Level = typeof LEVELS[number];

function levelChip(level: Level): string {
  const map: Record<Level, string> = {
    beginner:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    intermediate: 'bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-400',
    advanced:     'bg-rose-100    text-rose-700    dark:bg-rose-900/40    dark:text-rose-400',
  };
  return map[level] ?? 'bg-slate-100 text-slate-600';
}

@Component({
  selector: 'app-my-skills',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-slate-50 dark:bg-background-dark">
      <app-sidebar />

      <main class="flex-1 ml-64 min-h-screen">
        <!-- Header -->
        <header class="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
                        border-b border-slate-200 dark:border-slate-800 px-8 py-4
                        flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">My Skills</h2>
            <p class="text-slate-500 text-sm mt-0.5">Manage the skills you offer and want to learn</p>
          </div>
          <a routerLink="/skills/browse"
            class="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl
                   bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity">
            <span class="material-symbols-outlined text-[18px]">explore</span>
            Browse All Skills
          </a>
        </header>

        <!-- Body -->
        <div class="p-8 max-w-5xl mx-auto space-y-8">

          @if (isLoading()) {
            <!-- Skeleton -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              @for (i of [1,2]; track i) {
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-pulse">
                  <div class="h-5 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
                  <div class="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
                  <div class="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                </div>
              }
            </div>
          } @else {

            <!-- Stats row -->
            <section class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Offering</p>
                <p class="text-3xl font-black text-primary">{{ offered().length }}</p>
                <p class="text-xs text-slate-400 mt-1">skills you can teach</p>
              </div>
              <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Wanting</p>
                <p class="text-3xl font-black text-amber-500">{{ wanted().length }}</p>
                <p class="text-xs text-slate-400 mt-1">skills you want to learn</p>
              </div>
              <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Level</p>
                <p class="text-sm font-extrabold capitalize text-slate-900 dark:text-white mt-1">
                  {{ userState.currentUser()?.level ?? 'Not set' }}
                </p>
              </div>
              <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Swaps</p>
                <p class="text-3xl font-black text-emerald-500">{{ userState.currentUser()?.totalSwaps ?? 0 }}</p>
                <p class="text-xs text-slate-400 mt-1">completed</p>
              </div>
            </section>

            <!-- Skills I Offer -->
            <section>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[22px]">school</span>
                  Skills I Offer
                </h3>
              </div>
              <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                @if (offered().length === 0) {
                  <div class="text-center py-8">
                    <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 block mb-2">school</span>
                    <p class="text-slate-500 font-semibold text-sm">No skills added yet</p>
                    <p class="text-slate-400 text-xs mt-1">Add skills you can teach others.</p>
                  </div>
                } @else {
                  <div class="flex flex-wrap gap-2 mb-4">
                    @for (skill of offered(); track skill) {
                      <span class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary
                                   rounded-xl text-sm font-semibold">
                        {{ skill }}
                        <button (click)="removeOffered(skill)"
                          class="ml-1 text-primary/60 hover:text-red-500 transition-colors"
                          [attr.aria-label]="'Remove ' + skill">
                          <span class="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </span>
                    }
                  </div>
                }
                <!-- Add skill -->
                <div class="flex gap-2 mt-2">
                  <input [formControl]="newOfferedCtrl"
                    (keydown.enter)="addOffered()"
                    placeholder="Type a skill and press Enter…"
                    class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                           bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-slate-400" />
                  <button (click)="addOffered()"
                    [disabled]="!newOfferedCtrl.value?.trim()"
                    class="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold
                           hover:opacity-90 transition-opacity disabled:opacity-40">
                    Add
                  </button>
                </div>
              </div>
            </section>

            <!-- Skills I Want -->
            <section>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="material-symbols-outlined text-amber-500 text-[22px]">star</span>
                  Skills I Want to Learn
                </h3>
              </div>
              <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                @if (wanted().length === 0) {
                  <div class="text-center py-8">
                    <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 block mb-2">star</span>
                    <p class="text-slate-500 font-semibold text-sm">No skills added yet</p>
                    <p class="text-slate-400 text-xs mt-1">Add skills you want others to teach you.</p>
                  </div>
                } @else {
                  <div class="flex flex-wrap gap-2 mb-4">
                    @for (skill of wanted(); track skill) {
                      <span class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30
                                   text-amber-700 dark:text-amber-400 rounded-xl text-sm font-semibold">
                        {{ skill }}
                        <button (click)="removeWanted(skill)"
                          class="ml-1 text-amber-500/60 hover:text-red-500 transition-colors"
                          [attr.aria-label]="'Remove ' + skill">
                          <span class="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </span>
                    }
                  </div>
                }
                <!-- Add skill -->
                <div class="flex gap-2 mt-2">
                  <input [formControl]="newWantedCtrl"
                    (keydown.enter)="addWanted()"
                    placeholder="Type a skill and press Enter…"
                    class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                           bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-slate-400" />
                  <button (click)="addWanted()"
                    [disabled]="!newWantedCtrl.value?.trim()"
                    class="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold
                           hover:opacity-90 transition-opacity disabled:opacity-40">
                    Add
                  </button>
                </div>
              </div>
            </section>

            <!-- Save button -->
            @if (isDirty()) {
              <div class="flex justify-end gap-3">
                <button (click)="discardChanges()"
                  class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                         text-slate-600 dark:text-slate-300 text-sm font-semibold
                         hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Discard
                </button>
                <button (click)="save()"
                  [disabled]="isSaving()"
                  class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white
                         rounded-xl text-sm font-bold hover:opacity-90 transition-opacity
                         disabled:opacity-50">
                  @if (isSaving()) {
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Saving…
                  } @else {
                    <span class="material-symbols-outlined text-[18px]">save</span>
                    Save Changes
                  }
                </button>
              </div>
            }

          }
        </div>
      </main>
    </div>
  `,
})
export class MySkillsComponent implements OnInit, OnDestroy {
  readonly userState = inject(UserStateService);
  private readonly profileSvc = inject(ProfileService);
  private readonly toast      = inject(ToastService);
  private readonly destroy$   = new Subject<void>();

  isLoading = signal(true);
  isSaving  = signal(false);

  offered = signal<string[]>([]);
  wanted  = signal<string[]>([]);

  // snapshots for dirty check + discard
  private _origOffered: string[] = [];
  private _origWanted:  string[] = [];

  readonly isDirty = computed(() =>
    JSON.stringify(this.offered()) !== JSON.stringify(this._origOffered) ||
    JSON.stringify(this.wanted())  !== JSON.stringify(this._origWanted)
  );

  newOfferedCtrl = new FormControl('');
  newWantedCtrl  = new FormControl('');

  ngOnInit(): void {
    this.profileSvc.getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          const o = user.skillsOffered ?? [];
          const w = user.skillsWanted  ?? [];
          this.offered.set([...o]);
          this.wanted.set([...w]);
          this._origOffered = [...o];
          this._origWanted  = [...w];
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addOffered(): void {
    const val = this.newOfferedCtrl.value?.trim();
    if (!val) return;
    if (!this.offered().includes(val)) {
      this.offered.update(list => [...list, val]);
    }
    this.newOfferedCtrl.setValue('');
  }

  removeOffered(skill: string): void {
    this.offered.update(list => list.filter(s => s !== skill));
  }

  addWanted(): void {
    const val = this.newWantedCtrl.value?.trim();
    if (!val) return;
    if (!this.wanted().includes(val)) {
      this.wanted.update(list => [...list, val]);
    }
    this.newWantedCtrl.setValue('');
  }

  removeWanted(skill: string): void {
    this.wanted.update(list => list.filter(s => s !== skill));
  }

  discardChanges(): void {
    this.offered.set([...this._origOffered]);
    this.wanted.set([...this._origWanted]);
  }

  save(): void {
    this.isSaving.set(true);
    this.profileSvc.updateProfile({
      skillsOffered: this.offered(),
      skillsWanted:  this.wanted(),
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this._origOffered = [...this.offered()];
          this._origWanted  = [...this.wanted()];
          this.isSaving.set(false);
          this.toast.success('Skills updated successfully!');
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error(err?.error?.message ?? 'Failed to save skills.');
        },
      });
  }
}
