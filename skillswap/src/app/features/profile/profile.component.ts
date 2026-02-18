import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { NavbarComponent }    from '../../shared/components/navbar/navbar.component';
import { FooterComponent }    from '../../shared/components/footer/footer.component';
import { ProfileService }     from '../../core/services/profile.service';
import { AuthService }        from '../../core/services/auth.service';
import { UserStateService }   from '../../core/services/user-state.service';
import { ReviewService }      from '../../core/services/review.service';
import { User }               from '../../core/models/user.model';
import { StudentProfile }     from '../../core/models/skill.model';
import { Review, ReviewSummary } from '../../core/models/review.model';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NavbarComponent, FooterComponent, StarRatingComponent],
  template: `
    <app-navbar />


    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Loading spinner -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-24">
          <span class="material-symbols-outlined text-primary animate-spin text-4xl">refresh</span>
        </div>

      <!-- Loaded state -->
      } @else if (displayProfile()) {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <!-- ════════════════════════════════════════════════════════
               LEFT COLUMN — profile card + connect card
               ════════════════════════════════════════════════════════ -->
          <aside class="lg:col-span-4 space-y-6">

            <!-- Profile card -->
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200
                        dark:border-slate-800 p-6 shadow-sm overflow-hidden relative">
              <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/20 to-primary/5"></div>

              <div class="relative flex flex-col items-center pt-8">

                <!-- Avatar -->
                <div class="relative size-32 group mb-4">
                  <div class="size-32 rounded-full border-4 border-white dark:border-slate-900
                              overflow-hidden shadow-lg bg-primary/10 flex items-center justify-center">
                    @if (avatarPreview() || displayProfile()!.avatar) {
                      <img [src]="avatarPreview() || displayProfile()!.avatar"
                           [alt]="displayProfile()!.name"
                           class="h-full w-full object-cover" />
                    } @else {
                      <span class="material-symbols-outlined text-primary" style="font-size:3.5rem">person</span>
                    }
                  </div>

                  <!-- Upload overlay (own profile, edit mode) -->
                  @if (isOwnProfile && isEditing()) {
                    <button type="button"
                            (click)="fileInput.click()"
                            class="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center
                                   opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span class="material-symbols-outlined text-white text-2xl">photo_camera</span>
                      <span class="text-white text-[10px] font-bold mt-0.5">Change</span>
                    </button>
                    <input #fileInput type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                           class="hidden" (change)="onFileSelected($event)" />
                  }
                </div>

                <!-- Name & meta -->
                <div class="text-center">
                  <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ displayProfile()!.name }}</h1>
                  <div class="flex items-center justify-center gap-1.5 mt-1 text-slate-600 dark:text-slate-400">
                    <span class="material-symbols-outlined text-sm text-primary">verified</span>
                    <span class="text-sm font-medium">{{ displayProfile()!.university || 'University Student' }}</span>
                  </div>
                  <p class="text-sm text-slate-500 mt-0.5">
                    {{ displayProfile()!.major || 'Student' }}
                    @if (displayProfile()?.level) {
                      &bull; <span class="capitalize">{{ displayProfile()?.level }}</span>
                    }
                  </p>
                </div>

                <!-- Stats row -->
                <div class="w-full grid grid-cols-3 gap-4 mt-8 py-4 border-y border-slate-100 dark:border-slate-800">
                  <div class="text-center">
                    <span class="block text-xl font-bold text-slate-900 dark:text-white">
                      {{ displayProfile()!.totalSwaps }}
                    </span>
                    <span class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Swaps</span>
                  </div>
                  <div class="text-center">
                    <span class="block text-xl font-bold text-slate-900 dark:text-white">
                      {{ ownUser()?.totalHours ?? hoursCount }}
                    </span>
                    <span class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Hours</span>
                  </div>
                  <div class="text-center">
                    <span class="block text-xl font-bold text-slate-900 dark:text-white">
                      {{ displayProfile()!.rating.toFixed(1) }}
                    </span>
                    <span class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Rating</span>
                  </div>
                </div>

                <!-- Rating stars -->
                <div class="mt-4 flex items-center gap-2">
                  <app-star-rating [value]="displayProfile()!.rating" size="sm" />
                  <span class="text-xs text-slate-500">({{ displayProfile()!.rating.toFixed(1) }}/5)</span>
                </div>

                <!-- CTA buttons -->
                @if (isOwnProfile) {
                  <div class="mt-6 w-full flex flex-col gap-2">
                    @if (!isEditing()) {
                      <button type="button" (click)="startEditing()"
                              class="w-full py-2.5 px-4 bg-primary text-white rounded-lg font-bold text-sm
                                     shadow-md shadow-primary/20 hover:bg-primary/90 transition-all
                                     flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-sm">edit</span> Edit Profile
                      </button>
                    } @else {
                      <button type="button" (click)="submitForm()"
                              [disabled]="isSaving()"
                              class="w-full py-2.5 px-4 bg-primary text-white rounded-lg font-bold text-sm
                                     shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-60
                                     transition-all flex items-center justify-center gap-2">
                        @if (isSaving()) {
                          <span class="material-symbols-outlined text-sm animate-spin">refresh</span> Saving…
                        } @else {
                          <span class="material-symbols-outlined text-sm">save</span> Save Changes
                        }
                      </button>
                      <button type="button" (click)="cancelEditing()"
                              class="w-full py-2 px-4 border border-slate-200 dark:border-slate-700
                                     text-slate-600 dark:text-slate-400 rounded-lg font-semibold text-sm
                                     hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                        Cancel
                      </button>
                    }
                  </div>
                } @else {
                  <a [routerLink]="['/swaps', 'propose', displayProfile()!._id]"
                     class="mt-6 w-full py-2.5 px-4 bg-primary text-white rounded-lg font-bold text-sm
                            shadow-md shadow-primary/20 hover:bg-primary/90 transition-all
                            flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-sm">swap_horiz</span> Propose Swap
                  </a>
                }
              </div>
            </div>

            <!-- Connect card -->
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                <span class="material-symbols-outlined text-primary">link</span> Connect
              </h3>
              <div class="space-y-3">
                <div class="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                  <span class="material-symbols-outlined text-slate-400">mail</span>
                  {{ displayProfile()!.email }}
                </div>
                <div class="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                  <span class="material-symbols-outlined text-slate-400">school</span>
                  In-person &amp; Remote
                </div>
              </div>
            </div>
          </aside>

          <!-- ════════════════════════════════════════════════════════
               RIGHT COLUMN — either edit form or read-only content
               ════════════════════════════════════════════════════════ -->
          <div class="lg:col-span-8 space-y-6">

            <!-- ── EDIT FORM (own profile, edit mode) ─────────────── -->
            @if (isOwnProfile && isEditing()) {
              <form [formGroup]="form" (ngSubmit)="submitForm()" class="space-y-6">

                <!-- Save error banner -->
                @if (saveError()) {
                  <div class="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                               text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
                    <span class="material-symbols-outlined text-sm">error</span>
                    {{ saveError() }}
                  </div>
                }

                <!-- Basic info -->
                <section class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-5">Basic Information</h2>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <!-- Name -->
                    <div class="md:col-span-2">
                      <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input formControlName="name" type="text" placeholder="Your full name"
                             class="w-full px-4 py-2.5 rounded-lg border text-sm text-slate-900 dark:text-white
                                    bg-slate-50 dark:bg-slate-800 outline-none transition-colors
                                    focus:ring-2 focus:ring-primary/30 focus:border-primary"
                             [class.border-red-400]="isInvalid(f['name'])"
                             [class.border-slate-200]="!isInvalid(f['name'])"
                             [class.dark:border-slate-700]="!isInvalid(f['name'])" />
                      @if (isInvalid(f['name'])) {
                        <p class="text-red-500 text-xs mt-1">Name must be at least 2 characters.</p>
                      }
                    </div>

                    <!-- University -->
                    <div>
                      <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">University</label>
                      <input formControlName="university" type="text" placeholder="Your university"
                             class="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700
                                    text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800
                                    outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                    </div>

                    <!-- Major -->
                    <div>
                      <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Major</label>
                      <input formControlName="major" type="text" placeholder="Your major"
                             class="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700
                                    text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800
                                    outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                    </div>

                    <!-- Level -->
                    <div class="md:col-span-2">
                      <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Skill Level</label>
                      <div class="flex gap-3 flex-wrap">
                        @for (lvl of levels; track lvl.value) {
                          <button type="button" (click)="setLevel(lvl.value)"
                                  [class]="form.value.level === lvl.value
                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary/50'"
                                  class="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all">
                            <span class="material-symbols-outlined text-sm">{{ lvl.icon }}</span>
                            {{ lvl.label }}
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Bio -->
                <section class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-3">About Me</h2>
                  <textarea formControlName="bio" rows="4" placeholder="Tell others about yourself, your interests, and what you'd like to learn…"
                            class="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700
                                   text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800
                                   outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                                   resize-none transition-colors"></textarea>
                  <p class="text-xs text-slate-400 mt-1.5 text-right">{{ (form.value.bio || '').length }}/500</p>
                </section>

                <!-- Skills Offered -->
                <section class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <span class="material-symbols-outlined text-green-500">check_circle</span> Skills I Can Teach
                  </h2>
                  <p class="text-xs text-slate-400 mb-4">Press <kbd class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">Enter</kbd> or click <strong>+</strong> to add a skill.</p>

                  <!-- Chip list -->
                  <div class="flex flex-wrap gap-2 mb-3">
                    @for (skill of skillsOffered(); track skill) {
                      <span class="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-primary/10 text-primary
                                   text-xs font-semibold rounded-full border border-primary/20">
                        {{ skill }}
                        <button type="button" (click)="removeSkill('offered', skill)"
                                class="size-4 flex items-center justify-center rounded-full
                                       hover:bg-primary hover:text-white transition-colors">
                          <span class="material-symbols-outlined" style="font-size:12px">close</span>
                        </button>
                      </span>
                    }
                    @if (!skillsOffered().length) {
                      <p class="text-slate-400 text-sm italic">No skills added yet.</p>
                    }
                  </div>

                  <!-- Add input -->
                  <div class="flex gap-2">
                    <input #offeredInput type="text" placeholder="e.g. Python, Figma, Machine Learning…"
                           class="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                                  text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800
                                  outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                           (keydown.enter)="$event.preventDefault(); addSkill('offered', offeredInput.value); offeredInput.value = ''" />
                    <button type="button"
                            (click)="addSkill('offered', offeredInput.value); offeredInput.value = ''"
                            class="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                      <span class="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </section>

                <!-- Skills Wanted -->
                <section class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <span class="material-symbols-outlined text-amber-500">search</span> Skills I Want to Learn
                  </h2>
                  <p class="text-xs text-slate-400 mb-4">Press <kbd class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">Enter</kbd> or click <strong>+</strong> to add a skill.</p>

                  <div class="flex flex-wrap gap-2 mb-3">
                    @for (skill of skillsWanted(); track skill) {
                      <span class="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-amber-50 dark:bg-amber-900/20
                                   text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full
                                   border border-amber-200 dark:border-amber-800">
                        {{ skill }}
                        <button type="button" (click)="removeSkill('wanted', skill)"
                                class="size-4 flex items-center justify-center rounded-full
                                       hover:bg-amber-400 hover:text-white transition-colors">
                          <span class="material-symbols-outlined" style="font-size:12px">close</span>
                        </button>
                      </span>
                    }
                    @if (!skillsWanted().length) {
                      <p class="text-slate-400 text-sm italic">No skills added yet.</p>
                    }
                  </div>

                  <div class="flex gap-2">
                    <input #wantedInput type="text" placeholder="e.g. React, Guitar, Photography…"
                           class="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                                  text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800
                                  outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                           (keydown.enter)="$event.preventDefault(); addSkill('wanted', wantedInput.value); wantedInput.value = ''" />
                    <button type="button"
                            (click)="addSkill('wanted', wantedInput.value); wantedInput.value = ''"
                            class="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                      <span class="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </section>

              </form>

            <!-- ── READ-ONLY VIEW ──────────────────────────────────── -->
            } @else {

              <!-- Bio -->
              <section class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">About Me</h2>
                <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {{ displayProfile()!.bio || 'No bio added yet.' }}
                </p>
                @if (displayProfile()?.level) {
                  <span class="inline-flex items-center gap-1.5 mt-4 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full capitalize">
                    <span class="material-symbols-outlined text-sm">school</span>
                    {{ displayProfile()!.level }}
                  </span>
                }
              </section>

              <!-- Skills Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-green-500">check_circle</span> Skills Offered
                  </h2>
                  <div class="flex flex-wrap gap-2">
                    @for (skill of displaySkillsOffered(); track skill) {
                      <span class="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full shadow-sm">{{ skill }}</span>
                    }
                    @if (!displaySkillsOffered().length) {
                      <p class="text-slate-500 text-sm">None listed yet.</p>
                    }
                  </div>
                </section>

                <section class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-amber-500">search</span> Skills Wanted
                  </h2>
                  <div class="flex flex-wrap gap-2">
                    @for (skill of displaySkillsWanted(); track skill) {
                      <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                                   text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700">{{ skill }}</span>
                    }
                    @if (!displaySkillsWanted().length) {
                      <p class="text-slate-500 text-sm">None listed yet.</p>
                    }
                  </div>
                </section>
              </div>

              <!-- Reviews -->
              <section class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <div class="flex items-center justify-between mb-8">
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white">Recent Reviews</h2>
                  @if (reviewSummary()) {
                    <span class="text-sm text-slate-500">{{ reviewSummary()!.average }}/5
                      &middot; {{ reviewSummary()!.total }} {{ reviewSummary()!.total === 1 ? 'review' : 'reviews' }}</span>
                  }
                </div>
                @if (reviewsLoading()) {
                  <div class="space-y-4">
                    @for (i of [1, 2]; track i) {
                      <div class="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                    }
                  </div>
                } @else if (reviews().length === 0) {
                  <p class="text-sm text-slate-400 text-center py-8">No reviews yet.</p>
                } @else {
                  <div class="space-y-6">
                    @for (review of reviews(); track review._id) {
                      <div class="flex gap-4 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                        <div class="size-12 rounded-full overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                          @if (review.reviewer.avatar) {
                            <img [src]="review.reviewer.avatar" [alt]="review.reviewer.name" class="w-full h-full object-cover" />
                          } @else {
                            <span class="material-symbols-outlined text-primary">person</span>
                          }
                        </div>
                        <div class="flex-1">
                          <div class="flex justify-between items-start">
                            <div>
                              <h4 class="font-bold text-slate-900 dark:text-white">{{ review.reviewer.name }}</h4>
                              @if (review.skillTaught) {
                                <p class="text-xs text-primary font-medium">{{ review.skillTaught }}</p>
                              }
                            </div>
                            <span class="text-xs text-slate-400">{{ timeAgo(review.createdAt) }}</span>
                          </div>
                          <div class="flex items-center mb-2">
                            <app-star-rating [value]="review.rating" size="sm" />
                          </div>
                          @if (review.comment) {
                            <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{{ review.comment }}</p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </section>
            }

          </div>
        </div>
      }
    </main>

    <app-footer />
  `,
})
export class ProfileComponent implements OnInit, OnDestroy {
  // ── DI ──────────────────────────────────────────────────────────────────
  private readonly profileService = inject(ProfileService);
  private readonly authService    = inject(AuthService);
  private readonly userState      = inject(UserStateService);
  private readonly reviewService  = inject(ReviewService);
  private readonly toast          = inject(ToastService);
  private readonly route          = inject(ActivatedRoute);
  private readonly fb             = inject(FormBuilder);
  private readonly destroy$       = new Subject<void>();

  // ── State signals ──────────────────────────────────────────────────────────────────
  readonly isLoading    = signal(true);
  readonly isEditing    = signal(false);
  readonly isSaving     = signal(false);
  readonly saveError    = signal<string | null>(null);
  readonly avatarPreview = signal<string | null>(null);

  /** Own profile data (full User, returned by /users/me). */
  readonly ownUser = signal<User | null>(null);
  /** Other user's profile (StudentProfile, returned by /users/:id). */
  readonly otherProfile = signal<StudentProfile | null>(null);

  /** Editable skill arrays — managed separately from FormGroup. */
  readonly skillsOffered = signal<string[]>([]);
  readonly skillsWanted  = signal<string[]>([]);

  /** Unified display object used by the template for both own + other profiles. */
  readonly displayProfile = computed<(StudentProfile & { email: string; bio?: string }) | null>(() => {
    const own   = this.ownUser();
    const other = this.otherProfile();
    if (own) {
      return {
        _id:        own._id ?? '',
        name:       own.name,
        email:      own.email,
        avatar:     own.avatar,
        university: own.university,
        major:      own.major,
        bio:        own.bio,
        teaches:    own.skillsOffered,
        wants:      own.skillsWanted,
        rating:     own.rating ?? 0,
        totalSwaps: own.totalSwaps ?? 0,
        isOnline:   false,
      };
    }
    if (other) return { ...other, email: other.email ?? '' };
    return null;
  });

  /** Skills shown in the read-only view (own profile uses ownUser signals). */
  readonly displaySkillsOffered = computed(() =>
    this.ownUser() ? this.ownUser()!.skillsOffered : (this.otherProfile()?.teaches ?? []));
  readonly displaySkillsWanted = computed(() =>
    this.ownUser() ? this.ownUser()!.skillsWanted : (this.otherProfile()?.wants ?? []));

  // ── Review signals ────────────────────────────────────────────────────────
  readonly reviews        = signal<Review[]>([]);
  readonly reviewSummary  = signal<ReviewSummary | null>(null);
  readonly reviewsLoading = signal(true);

  // ── Config ───────────────────────────────────────────────────────────────
  isOwnProfile = false;
  hoursCount   = 12;

  readonly levels = [
    { value: 'beginner' as const,     label: 'Beginner',     icon: 'emoji_objects' },
    { value: 'intermediate' as const, label: 'Intermediate', icon: 'trending_up'  },
    { value: 'advanced' as const,     label: 'Advanced',     icon: 'workspace_premium' },
  ];

  // ── Reactive Form ────────────────────────────────────────────────────────
  form!: FormGroup;

  // convenience getter  so template can write f['name']
  get f(): { [key: string]: AbstractControl } { return this.form.controls; }

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
    const paramId = this.route.snapshot.paramMap.get('id');
    const me      = this.authService.getCurrentUser();
    this.isOwnProfile = !paramId || paramId === me?._id;

    if (this.isOwnProfile) {
      this.loadOwnProfile();
    } else {
      this.loadOtherProfile(paramId!);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Loaders ──────────────────────────────────────────────────────────────
  private loadOwnProfile(): void {
    this.profileService.getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: user => {
          this.ownUser.set(user);
          this.skillsOffered.set([...user.skillsOffered]);
          this.skillsWanted.set([...user.skillsWanted]);
          this.patchForm(user);
          this.isLoading.set(false);
          if (user._id) this.loadReviews(user._id);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private loadOtherProfile(id: string): void {
    this.profileService.getProfileById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: p  => {
          this.otherProfile.set(p);
          this.isLoading.set(false);
          this.loadReviews(id);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private loadReviews(userId: string): void {
    this.reviewsLoading.set(true);
    this.reviewService.getReviewsForUser(userId, 1, 5)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.reviews.set(res.reviews);
          this.reviewSummary.set(res.summary);
          this.reviewsLoading.set(false);
        },
        error: () => this.reviewsLoading.set(false),
      });
  }

  // ── Form helpers ─────────────────────────────────────────────────────────
  private buildForm(): void {
    this.form = this.fb.group({
      name:       ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      bio:        ['', Validators.maxLength(500)],
      university: ['', Validators.maxLength(100)],
      major:      ['', Validators.maxLength(100)],
      level:      ['beginner'],
    });
  }

  private patchForm(u: User): void {
    this.form.patchValue({
      name:       u.name,
      bio:        u.bio         ?? '',
      university: u.university  ?? '',
      major:      u.major       ?? '',
      level:      u.level       ?? 'beginner',
    });
  }

  isInvalid(ctrl: AbstractControl): boolean {
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  setLevel(lvl: 'beginner' | 'intermediate' | 'advanced'): void {
    this.form.patchValue({ level: lvl });
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  startEditing(): void {
    const user = this.ownUser();
    if (user) {
      this.patchForm(user);
      this.skillsOffered.set([...user.skillsOffered]);
      this.skillsWanted.set([...user.skillsWanted]);
    }
    this.saveError.set(null);
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.saveError.set(null);
    this.avatarPreview.set(null);
    this._pendingFile = null;
    // Restore skills display to current server state
    const user = this.ownUser();
    if (user) {
      this.skillsOffered.set([...user.skillsOffered]);
      this.skillsWanted.set([...user.skillsWanted]);
    }
  }

  // ── Skill chips ───────────────────────────────────────────────────────────
  addSkill(type: 'offered' | 'wanted', value: string): void {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (type === 'offered') {
      const current = this.skillsOffered();
      if (!current.includes(trimmed)) this.skillsOffered.set([...current, trimmed]);
    } else {
      const current = this.skillsWanted();
      if (!current.includes(trimmed)) this.skillsWanted.set([...current, trimmed]);
    }
  }

  removeSkill(type: 'offered' | 'wanted', skill: string): void {
    if (type === 'offered') {
      this.skillsOffered.update(arr => arr.filter(s => s !== skill));
    } else {
      this.skillsWanted.update(arr => arr.filter(s => s !== skill));
    }
  }

  // ── Image upload ──────────────────────────────────────────────────────────
  private _pendingFile: File | null = null;

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this._pendingFile = file;
    // Generate object URL for instant preview
    const reader = new FileReader();
    reader.onload = e => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  submitForm(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving()) return;

    const { name, bio, university, major, level } = this.form.value;
    const payload = {
      name, bio, university, major,
      level: level as 'beginner' | 'intermediate' | 'advanced',
      skillsOffered: this.skillsOffered(),
      skillsWanted:  this.skillsWanted(),
    };

    // ── Optimistic update — apply locally before the API responds ─────────
    const prev = this.ownUser();
    const optimistic: User = {
      ...(prev ?? ({} as User)),
      ...payload,
      avatar: this.avatarPreview() ?? prev?.avatar,
    };
    this.ownUser.set(optimistic);
    this.isEditing.set(false);   // collapse form immediately

    // ── API call ──────────────────────────────────────────────────────────
    this.isSaving.set(true);
    this.saveError.set(null);

    this.profileService.updateProfile(payload, this._pendingFile ?? undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: confirmed => {
          // Confirm with server response
          this.ownUser.set(confirmed);
          this.skillsOffered.set([...confirmed.skillsOffered]);
          this.skillsWanted.set([...confirmed.skillsWanted]);
          this.avatarPreview.set(null);
          this._pendingFile = null;
          this.isSaving.set(false);
          this.showSuccessToast();
        },
        error: err => {
          // Rollback optimistic update
          this.ownUser.set(prev);
          if (prev) {
            this.skillsOffered.set([...prev.skillsOffered]);
            this.skillsWanted.set([...prev.skillsWanted]);
          }
          this.avatarPreview.set(null);
          this._pendingFile = null;
          this.isSaving.set(false);
          this.isEditing.set(true);  // re-open form so user can fix it
          this.saveError.set(err?.message ?? 'Failed to save profile. Please try again.');
        },
      });
  }

  private showSuccessToast(): void {
    this.toast.success('Profile updated successfully!');
  }

  // ── Utilities ─────────────────────────────────────────────────────────────
  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    if (mins  < 1)   return 'Just now';
    if (mins  < 60)  return `${mins} min${mins > 1 ? 's' : ''} ago`;
    if (hours < 24)  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days  < 7)   return `${days} day${days > 1 ? 's' : ''} ago`;
    if (weeks < 5)   return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}

