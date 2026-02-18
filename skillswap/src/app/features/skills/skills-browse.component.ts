import {
  Component, OnInit, OnDestroy,
  inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  Subject, debounceTime, distinctUntilChanged, takeUntil,
} from 'rxjs';
import { SidebarComponent }    from '../../shared/components/sidebar/sidebar.component';
import { SkillService }        from '../../core/services/skill.service';
import { SwapRequestService }  from '../../core/services/swap-request.service';
import { UserStateService }    from '../../core/services/user-state.service';
import {
  StudentProfile,
  SKILL_CATEGORIES,
} from '../../core/models/skill.model';

type Toast = { type: 'success' | 'error'; msg: string };

@Component({
  selector: 'app-skills-browse',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-slate-50 dark:bg-background-dark">
      <app-sidebar />

      <div class="flex-1 ml-64 min-h-screen flex flex-col">

        <!-- Header -->
        <header class="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
                        border-b border-slate-200 dark:border-slate-800 px-8 py-4
                        flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Browse Skills</h2>
            <p class="text-slate-500 text-sm mt-0.5">Find people who can teach you — and offer your skills in return</p>
          </div>
          @if (isLoggedIn()) {
            <a routerLink="/my-skills"
              class="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity no-underline">
              <span class="material-symbols-outlined text-[18px]">auto_stories</span>
              My Skills
            </a>
          }
        </header>

        <main class="flex-1 px-8 py-8 max-w-7xl w-full mx-auto">

          <!-- ── Search + filter bar ──────────────────────────────── -->
          <div class="flex flex-col sm:flex-row gap-4 mb-8">

            <!-- Search -->
            <div class="flex-1 relative">
              <span class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span class="material-symbols-outlined text-primary text-2xl">search</span>
              </span>
              <input [formControl]="searchCtrl"
                class="block w-full pl-12 pr-10 py-3.5 bg-white dark:bg-slate-900
                       border border-slate-200 dark:border-slate-700
                       shadow-sm rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary
                       text-base placeholder:text-slate-400 text-slate-900 dark:text-white outline-none"
                placeholder="Search by name or skill…" />
              @if (searchCtrl.value) {
                <button (click)="searchCtrl.setValue('')"
                  class="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600">
                  <span class="material-symbols-outlined">close</span>
                </button>
              }
            </div>

            <!-- Result count + clear -->
            @if (totalUsers() > 0) {
              <div class="flex items-center gap-3 shrink-0">
                <span class="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {{ totalUsers() }} member{{ totalUsers() !== 1 ? 's' : '' }}
                </span>
                @if (searchCtrl.value) {
                  <button (click)="clearSearch()"
                    class="text-sm font-semibold text-primary hover:underline">
                    Clear
                  </button>
                }
              </div>
            }
          </div>

          <!-- ── Category chips ───────────────────────────────────── -->
          <div class="flex gap-2.5 overflow-x-auto pb-2 mb-8 scrollbar-none">
            <button (click)="setCategory(null)"
              [class]="!activeCategory()
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50'"
              class="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-all">
              <span class="material-symbols-outlined text-[18px]">apps</span> All
            </button>
            @for (cat of categories; track cat.label) {
              <button (click)="setCategory(cat.label)"
                [class]="activeCategory() === cat.label
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50'"
                class="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-medium transition-all">
                <span class="material-symbols-outlined text-[18px]">{{ cat.icon }}</span>
                {{ cat.label }}
              </button>
            }
          </div>

          <!-- ── User grid ────────────────────────────────────────── -->
          @if (isLoading()) {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (i of skeletons; track i) {
                <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100
                            dark:border-slate-800 animate-pulse space-y-4 h-64">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                      <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                  <div class="flex gap-2 flex-wrap">
                    <div class="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                    <div class="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                    <div class="h-6 w-14 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                  </div>
                  <div class="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl mt-auto"></div>
                </div>
              }
            </div>

          } @else if (error()) {
            <div class="text-center py-20">
              <span class="material-symbols-outlined text-rose-300 text-6xl">error_outline</span>
              <p class="mt-4 text-slate-700 dark:text-slate-300 font-medium">{{ error() }}</p>
              <button (click)="fetch()"
                class="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition">
                Retry
              </button>
            </div>

          } @else if (isEmpty()) {
            <div class="text-center py-20">
              <span class="material-symbols-outlined text-slate-300 dark:text-slate-700 text-7xl">person_search</span>
              <p class="mt-5 text-slate-500 dark:text-slate-400 text-lg font-medium">
                No members found{{ searchCtrl.value ? ' for "' + searchCtrl.value + '"' : '' }}.
              </p>
              @if (searchCtrl.value || activeCategory()) {
                <button (click)="clearSearch()"
                  class="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition">
                  Clear filters
                </button>
              }
            </div>

          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (user of users(); track user._id) {
                <article class="group relative flex flex-col bg-white dark:bg-slate-900
                               rounded-2xl border border-slate-100 dark:border-slate-800
                               p-6 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-0.5
                               transition-all duration-200 overflow-hidden">

                  <!-- Accent stripe -->
                  <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r
                              from-primary/60 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <!-- User identity row -->
                  <div class="flex items-start gap-4 mb-4">
                    <!-- Avatar -->
                    <a [routerLink]="['/profile', user._id]" class="shrink-0 cursor-pointer">
                      @if (user.avatar) {
                        <img [src]="user.avatar" [alt]="user.name"
                          class="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100
                                 dark:border-slate-800 hover:ring-2 hover:ring-primary transition-all" />
                      } @else {
                        <span class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/60
                                     flex items-center justify-center text-white font-black text-xl
                                     hover:ring-2 hover:ring-primary transition-all">
                          {{ initials(user.name) }}
                        </span>
                      }
                    </a>

                    <!-- Name / university -->
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <a [routerLink]="['/profile', user._id]"
                           class="font-bold text-slate-900 dark:text-white text-base truncate
                                  hover:text-primary transition-colors cursor-pointer">
                          {{ user.name }}
                        </a>
                        @if (user.isOnline) {
                          <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                                title="Online"></span>
                        }
                      </div>
                      @if (user.university) {
                        <p class="text-xs text-slate-400 truncate mt-0.5">{{ user.university }}</p>
                      }
                      @if (user.rating > 0) {
                        <div class="flex items-center gap-1 mt-1">
                          <span class="material-symbols-outlined text-amber-400 text-[14px]">star</span>
                          <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {{ user.rating | number:'1.1-1' }}
                          </span>
                          @if (user.totalSwaps > 0) {
                            <span class="text-xs text-slate-400">· {{ user.totalSwaps }} swap{{ user.totalSwaps !== 1 ? 's' : '' }}</span>
                          }
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Skills offered -->
                  @if (user.teaches && user.teaches.length > 0) {
                    <div class="mb-3">
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px] text-emerald-500">school</span>
                        Can teach
                      </p>
                      <div class="flex flex-wrap gap-1.5">
                        @for (skill of user.teaches.slice(0, 4); track skill) {
                          <span class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20
                                       text-emerald-700 dark:text-emerald-400
                                       text-[11px] font-semibold rounded-lg">
                            {{ skill }}
                          </span>
                        }
                        @if (user.teaches.length > 4) {
                          <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800
                                       text-slate-500 text-[11px] font-semibold rounded-lg">
                            +{{ user.teaches.length - 4 }} more
                          </span>
                        }
                      </div>
                    </div>
                  }

                  <!-- Skills wanted -->
                  @if (user.wants && user.wants.length > 0) {
                    <div class="mb-4">
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px] text-primary">auto_stories</span>
                        Wants to learn
                      </p>
                      <div class="flex flex-wrap gap-1.5">
                        @for (skill of user.wants.slice(0, 3); track skill) {
                          <span class="px-2.5 py-1 bg-primary/8 dark:bg-primary/15
                                       text-primary text-[11px] font-semibold rounded-lg">
                            {{ skill }}
                          </span>
                        }
                        @if (user.wants.length > 3) {
                          <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800
                                       text-slate-500 text-[11px] font-semibold rounded-lg">
                            +{{ user.wants.length - 3 }} more
                          </span>
                        }
                      </div>
                    </div>
                  }

                  <!-- Spacer to push CTA to bottom -->
                  <div class="flex-1"></div>

                  <!-- CTA -->
                  @if (isLoggedIn()) {
                    <button (click)="openModal(user)"
                      class="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                             bg-primary/10 text-primary text-xs font-bold
                             hover:bg-primary hover:text-white transition-all
                             group-hover:bg-primary group-hover:text-white">
                      <span class="material-symbols-outlined text-[16px]">swap_horiz</span>
                      Request Swap
                    </button>
                  } @else {
                    <a routerLink="/auth/login"
                      class="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                             border border-slate-200 dark:border-slate-700 text-slate-400
                             text-xs font-semibold hover:border-primary hover:text-primary transition-all no-underline">
                      <span class="material-symbols-outlined text-[16px]">login</span>
                      Login to Request
                    </a>
                  }
                </article>
              }
            </div>
          }

          <!-- ── Pagination ──────────────────────────────────────── -->
          @if (totalPages() > 1) {
            <nav class="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
              <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1"
                class="flex items-center justify-center w-10 h-10 rounded-xl
                       bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                       text-slate-400 hover:bg-primary hover:text-white hover:border-primary
                       transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <span class="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              @for (p of pageNumbers(); track p) {
                <button (click)="goToPage(p)"
                  [class]="p === currentPage()
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary/5'"
                  class="flex items-center justify-center w-10 h-10 rounded-xl font-bold transition-all">
                  {{ p }}
                </button>
              }
              <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()"
                class="flex items-center justify-center w-10 h-10 rounded-xl
                       bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                       text-slate-400 hover:bg-primary hover:text-white hover:border-primary
                       transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <span class="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </nav>
            <p class="mt-3 text-center text-xs text-slate-400">
              Page {{ currentPage() }} of {{ totalPages() }}
            </p>
          }

        </main>

        <!-- ── Toast ─────────────────────────────────────────────── -->
        @if (toast()) {
          <div [class]="toast()!.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'"
            class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5
                   rounded-2xl shadow-2xl text-sm font-semibold max-w-sm animate-[slideUp_0.25s_ease-out]">
            <span class="material-symbols-outlined text-[20px]">
              {{ toast()!.type === 'success' ? 'check_circle' : 'error' }}
            </span>
            {{ toast()!.msg }}
          </div>
        }

        <!-- ── Request Swap modal ─────────────────────────────────── -->
        @if (modalUser()) {
          <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" (click)="closeModal()"></div>
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
            <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl
                        border border-slate-100 dark:border-slate-800 pointer-events-auto
                        animate-[slideUp_0.2s_ease-out] overflow-hidden">

              <!-- Modal header: person info -->
              <div class="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                @if (modalUser()!.avatar) {
                  <img [src]="modalUser()!.avatar" [alt]="modalUser()!.name"
                    class="w-12 h-12 rounded-xl object-cover shrink-0" />
                } @else {
                  <span class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/60
                               flex items-center justify-center text-white font-black text-lg shrink-0">
                    {{ initials(modalUser()!.name) }}
                  </span>
                }
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-primary font-bold uppercase tracking-widest mb-0.5">Request a Skill Swap</p>
                  <h3 class="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                    with {{ modalUser()!.name }}
                  </h3>
                  @if (modalUser()!.university) {
                    <p class="text-xs text-slate-400 truncate">{{ modalUser()!.university }}</p>
                  }
                </div>
                <button (click)="closeModal()"
                  class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition shrink-0">
                  <span class="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              <div class="px-6 pt-5 pb-6 space-y-5">

                <!-- What skill to learn from them -->
                <div>
                  <label class="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Skill you want to learn
                  </label>
                  @if (modalUser()!.teaches && modalUser()!.teaches.length > 0) {
                    <div class="grid grid-cols-2 gap-2 mb-2">
                      @for (s of modalUser()!.teaches; track s) {
                        <button type="button" (click)="requestedSkillCtrl.setValue(s)"
                          [class]="requestedSkillCtrl.value === s
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'"
                          class="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-left">
                          <span class="material-symbols-outlined text-[14px] text-emerald-500">school</span>
                          <span class="truncate">{{ s }}</span>
                        </button>
                      }
                    </div>
                    <p class="text-xs text-slate-400 mb-1">Or type a different skill:</p>
                  }
                  <input [formControl]="requestedSkillCtrl"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                           bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm
                           focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 outline-none transition"
                    placeholder="What do you want to learn from them?" />
                </div>

                <!-- What skill to offer -->
                <div>
                  <label class="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Skill you will offer in exchange
                  </label>
                  @if (mySkills().length > 0) {
                    <div class="grid grid-cols-2 gap-2 mb-2">
                      @for (s of mySkills(); track s) {
                        <button type="button" (click)="offeredSkillCtrl.setValue(s)"
                          [class]="offeredSkillCtrl.value === s
                            ? 'border-primary bg-primary/8 text-primary shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50'"
                          class="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-left">
                          <span class="material-symbols-outlined text-[14px]">auto_fix_high</span>
                          <span class="truncate">{{ s }}</span>
                        </button>
                      }
                    </div>
                    <p class="text-xs text-slate-400 mb-1">Or type a different skill:</p>
                  }
                  <input [formControl]="offeredSkillCtrl"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                           bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm
                           focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                    placeholder="e.g. React, Spanish, Graphic Design…" />
                </div>

                <!-- Optional message -->
                <div>
                  <label class="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Personal note <span class="text-xs font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea [formControl]="messageCtrl" rows="3"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                           bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm
                           focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none
                           transition resize-none placeholder:text-slate-400"
                    placeholder="Introduce yourself or suggest a schedule…"></textarea>
                </div>

                @if (modalError()) {
                  <p class="flex items-center gap-1.5 text-rose-600 text-sm">
                    <span class="material-symbols-outlined text-[17px]">error</span>
                    {{ modalError() }}
                  </p>
                }

                <div class="flex gap-3 pt-1">
                  <button type="button" (click)="closeModal()"
                    class="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                           text-slate-600 dark:text-slate-300 text-sm font-semibold
                           hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    Cancel
                  </button>
                  <button type="button" (click)="submitRequest()"
                    [disabled]="submitting() || !offeredSkillCtrl.value?.trim() || !requestedSkillCtrl.value?.trim()"
                    class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                           bg-primary text-white text-sm font-bold hover:bg-primary/90 transition
                           shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed">
                    @if (submitting()) {
                      <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Sending…
                    } @else {
                      <span class="material-symbols-outlined text-[18px]">swap_horiz</span>
                      Send Request
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class SkillsBrowseComponent implements OnInit, OnDestroy {
  private readonly skillSvc  = inject(SkillService);
  private readonly swapSvc   = inject(SwapRequestService);
  private readonly userState = inject(UserStateService);
  private readonly destroy$  = new Subject<void>();

  // ── State ──────────────────────────────────────────────────────────────
  users       = signal<StudentProfile[]>([]);
  isLoading   = signal(true);
  error       = signal<string | null>(null);
  totalUsers  = signal(0);
  currentPage = signal(1);
  totalPages  = signal(1);

  readonly pageSize  = 12;
  readonly skeletons = Array.from({ length: 9 }, (_, i) => i);

  // ── Filters ────────────────────────────────────────────────────────────
  searchCtrl     = new FormControl('');
  activeCategory = signal<string | null>(null);

  readonly categories = SKILL_CATEGORIES;

  // ── Auth helpers ───────────────────────────────────────────────────────
  readonly isLoggedIn = this.userState.isLoggedIn;
  readonly mySkills   = computed(() => this.userState.currentUser()?.skillsOffered ?? []);

  // ── Modal state ────────────────────────────────────────────────────────
  modalUser          = signal<StudentProfile | null>(null);
  requestedSkillCtrl = new FormControl('');
  offeredSkillCtrl   = new FormControl('');
  messageCtrl        = new FormControl('');
  submitting         = signal(false);
  modalError         = signal<string | null>(null);
  toast              = signal<Toast | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Computed ───────────────────────────────────────────────────────────
  isEmpty = computed(() => !this.isLoading() && this.users().length === 0 && !this.error());

  pageNumbers = computed(() => {
    const total  = this.totalPages();
    const curr   = this.currentPage();
    const radius = 2;
    const start  = Math.max(1, curr - radius);
    const end    = Math.min(total, curr + radius);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.currentPage.set(1);
      this.fetch();
    });
    this.fetch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Data ───────────────────────────────────────────────────────────────
  fetch(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.skillSvc.getStudents(
      this.activeCategory() as any ?? undefined,
      this.searchCtrl.value?.trim() || undefined,
      this.currentPage(),
      this.pageSize,
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.totalUsers.set(res.total);
          const pages = (res as any).pages ?? Math.ceil(res.total / this.pageSize);
          this.totalPages.set(pages || 1);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'Failed to load members. Please try again.');
          this.users.set([]);
          this.isLoading.set(false);
        },
      });
  }

  setCategory(cat: string | null): void {
    this.activeCategory.set(cat);
    this.currentPage.set(1);
    this.fetch();
  }

  clearSearch(): void {
    this.searchCtrl.setValue('', { emitEvent: false });
    this.activeCategory.set(null);
    this.currentPage.set(1);
    this.fetch();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.fetch();
  }

  // ── Modal ──────────────────────────────────────────────────────────────
  openModal(user: StudentProfile): void {
    this.modalUser.set(user);
    this.requestedSkillCtrl.setValue('');
    this.offeredSkillCtrl.setValue('');
    this.messageCtrl.setValue('');
    this.modalError.set(null);
    this.submitting.set(false);
    // Pre-select first skill they teach
    if (user.teaches?.length === 1) this.requestedSkillCtrl.setValue(user.teaches[0]);
    // Pre-select if we have only one skill to offer
    if (this.mySkills().length === 1) this.offeredSkillCtrl.setValue(this.mySkills()[0]);
  }

  closeModal(): void {
    this.modalUser.set(null);
  }

  submitRequest(): void {
    const offered   = this.offeredSkillCtrl.value?.trim();
    const requested = this.requestedSkillCtrl.value?.trim();
    if (!offered)   { this.modalError.set('Please specify the skill you will offer.');   return; }
    if (!requested) { this.modalError.set('Please specify the skill you want to learn.'); return; }

    const user = this.modalUser();
    if (!user) return;

    this.submitting.set(true);
    this.modalError.set(null);

    this.swapSvc.createRequest({
      receiverId:     user._id,
      offeredSkill:   offered,
      requestedSkill: requested,
      message:        this.messageCtrl.value?.trim() || '',
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.showToast({ type: 'success', msg: `Swap request sent to ${user.name}!` });
        },
        error: (err) => {
          this.submitting.set(false);
          this.modalError.set(err?.error?.message ?? 'Failed to send request. Please try again.');
        },
      });
  }

  private showToast(t: Toast): void {
    this.toast.set(t);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 4000);
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  initials(name: string | undefined | null): string {
    if (!name) return '?';
    return (name ?? '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  }
}

